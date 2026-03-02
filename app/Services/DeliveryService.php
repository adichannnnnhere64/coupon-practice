<?php

namespace App\Services;

use App\Jobs\ProcessDeliveryJob;
use App\Models\DeliveryMethod;
use App\Models\PlanInventory;
use App\Models\User;
use App\Services\Delivery\DeliveryDriverInterface;
use App\Services\Delivery\DeliveryResult;
use App\Services\Delivery\EmailDeliveryDriver;
use App\Services\Delivery\SmsDeliveryDriver;
use App\Services\Delivery\WebhookDeliveryDriver;
use Illuminate\Support\Facades\Log;

class DeliveryService
{
    /**
     * Available delivery drivers
     *
     * @var array<class-string<DeliveryDriverInterface>>
     */
    protected array $drivers = [
        EmailDeliveryDriver::class,
        SmsDeliveryDriver::class,
        WebhookDeliveryDriver::class,
    ];

    /**
     * Queue deliveries for the given inventory IDs
     *
     * @param  int|null  $deliveryMethodId  Optional specific delivery method to use
     */
    public function queueDelivery(array $inventoryIds, User $user, ?int $deliveryMethodId = null): int
    {
        Log::info('Starting delivery queue');
        $queued = 0;

        $inventories = PlanInventory::with(['plan.deliveryMethod', 'plan.deliveryMethods'])
            ->whereIn('id', $inventoryIds)
            ->where('status', PlanInventory::STATUS_SOLD)
            ->get();

        // Get the specific delivery method if provided
        $specificDeliveryMethod = $deliveryMethodId
            ? DeliveryMethod::where('id', $deliveryMethodId)->where('is_active', true)->first()
            : null;

        foreach ($inventories as $inventory) {
            // Determine which delivery method to use:
            // 1. Specific delivery method from transaction (user selected)
            // 2. Plan's default delivery method (legacy)
            $deliveryMethod = $specificDeliveryMethod;

            if (! $deliveryMethod && $inventory->plan) {
                // Try many-to-many relationship first
                $deliveryMethod = $inventory->plan->deliveryMethods()
                    ->where('is_active', true)
                    ->wherePivot('is_default', true)
                    ->first();

                // Fall back to first available delivery method
                if (! $deliveryMethod) {
                    $deliveryMethod = $inventory->plan->deliveryMethods()
                        ->where('is_active', true)
                        ->first();
                }

                // Fall back to legacy single delivery method
                if (! $deliveryMethod) {
                    $deliveryMethod = $inventory->plan->deliveryMethod;
                }
            }

            if (! $deliveryMethod) {
                Log::info('Skipping delivery - no delivery method configured', [
                    'inventory_id' => $inventory->id,
                ]);

                continue;
            }

            if (! $deliveryMethod->is_active) {
                Log::info('Skipping delivery - delivery method inactive', [
                    'inventory_id' => $inventory->id,
                    'delivery_method_id' => $deliveryMethod->id,
                ]);

                continue;
            }

            // Store the selected delivery method ID in inventory metadata
            $inventory->update([
                'meta_data' => array_merge($inventory->meta_data ?? [], [
                    'delivery_method_id' => $deliveryMethod->id,
                ]),
            ]);

            // Manual delivery type doesn't get queued
            if ($deliveryMethod->type === DeliveryMethod::TYPE_MANUAL) {
                $inventory->update(['delivery_status' => PlanInventory::DELIVERY_PENDING]);

                continue;
            }

            $inventory->markDeliveryQueued();

            ProcessDeliveryJob::dispatch($inventory->id, $user->id)
                ->onQueue('deliveries');

            $queued++;
        }

        Log::info('Queued deliveries', [
            'total_items' => count($inventoryIds),
            'queued' => $queued,
            'user_id' => $user->id,
        ]);

        return $queued;
    }

    /**
     * Process delivery for a single inventory item
     */
    public function processDelivery(PlanInventory $inventory, User $user): DeliveryResult
    {
        // Get delivery method from inventory metadata first (user-selected)
        $deliveryMethodId = $inventory->meta_data['delivery_method_id'] ?? null;
        $deliveryMethod = null;

        if ($deliveryMethodId) {
            $deliveryMethod = DeliveryMethod::find($deliveryMethodId);
        }

        // Fall back to plan's delivery method
        if (! $deliveryMethod && $inventory->plan) {
            $deliveryMethod = $inventory->plan->deliveryMethod;
        }

        if (! $deliveryMethod) {
            return DeliveryResult::failure('No delivery method configured for this plan');
        }

        if (! $deliveryMethod->is_active) {
            return DeliveryResult::failure('Delivery method is inactive');
        }

        $driver = $this->getDriver($deliveryMethod->type);
        if (! $driver) {
            return DeliveryResult::failure("No driver available for delivery type: {$deliveryMethod->type}");
        }

        $inventory->markDeliverySending();

        try {
            $driver->setMethod($deliveryMethod);
            $result = $driver->deliver($inventory, $user);

            if ($result->isSuccessful()) {
                $inventory->markDeliverySent($result->getMetadata());
            } else {
                $this->handleFailure($inventory, $result);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Delivery processing error', [
                'inventory_id' => $inventory->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = DeliveryResult::failure('Delivery error: '.$e->getMessage());
            $this->handleFailure($inventory, $result);

            return $result;
        }
    }

    /**
     * Handle a failed delivery attempt
     */
    protected function handleFailure(PlanInventory $inventory, DeliveryResult $result): void
    {
        $inventory->markDeliveryFailed($result->getMessage());

        // Check if we should retry
        if ($inventory->canRetryDelivery()) {
            $deliveryMethod = $inventory->plan->deliveryMethod;
            $delay = $deliveryMethod->retry_delay_seconds;

            ProcessDeliveryJob::dispatch($inventory->id, $inventory->user_id)
                ->onQueue('deliveries')
                ->delay(now()->addSeconds($delay));

            Log::info('Scheduled delivery retry', [
                'inventory_id' => $inventory->id,
                'attempt' => $inventory->delivery_attempts,
                'delay_seconds' => $delay,
            ]);
        }
    }

    /**
     * Get the appropriate driver for a delivery type
     */
    protected function getDriver(string $type): ?DeliveryDriverInterface
    {
        foreach ($this->drivers as $driverClass) {
            $driver = app($driverClass);
            if ($driver->supports($type)) {
                return $driver;
            }
        }

        return null;
    }

    /**
     * Retry failed deliveries
     */
    public function retryFailedDeliveries(): int
    {
        $items = PlanInventory::retryableDeliveries()
            ->with(['plan.deliveryMethod', 'user'])
            ->get();

        $retried = 0;
        foreach ($items as $item) {
            if (! $item->user) {
                continue;
            }

            $item->markDeliveryQueued();

            ProcessDeliveryJob::dispatch($item->id, $item->user_id)
                ->onQueue('deliveries');

            $retried++;
        }

        return $retried;
    }

    /**
     * Get delivery statistics
     */
    public function getStatistics(): array
    {
        return [
            'pending' => PlanInventory::where('delivery_status', PlanInventory::DELIVERY_PENDING)->count(),
            'queued' => PlanInventory::where('delivery_status', PlanInventory::DELIVERY_QUEUED)->count(),
            'sending' => PlanInventory::where('delivery_status', PlanInventory::DELIVERY_SENDING)->count(),
            'sent' => PlanInventory::where('delivery_status', PlanInventory::DELIVERY_SENT)->count(),
            'failed' => PlanInventory::where('delivery_status', PlanInventory::DELIVERY_FAILED)->count(),
            'delivered' => PlanInventory::where('delivery_status', PlanInventory::DELIVERY_DELIVERED)->count(),
        ];
    }
}
