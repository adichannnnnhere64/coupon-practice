<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\PlanInventory;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Validate and reserve inventory for purchase
     */
    public function validateAndReserve(Plan $plan, int $quantity = 1, array $metadata = []): array
    {
        // Check if inventory is enabled
        if (!$plan->inventory_enabled) {
            return []; // No inventory needed
        }

        // Check available stock
        if (!$plan->hasAvailableInventory($quantity)) {
            throw new \Exception("Insufficient stock for plan: {$plan->name}. Available: {$plan->availableStock}, Requested: {$quantity}");
        }

        // Reserve inventory
        return $plan->reserveInventory($quantity, $metadata);
    }

    /**
     * Complete purchase - mark inventory as sold
     */
    public function completePurchase(array $inventoryItems, int $userId): void
    {
        if (empty($inventoryItems)) {
            return;
        }

        DB::transaction(function () use ($inventoryItems, $userId) {
            foreach ($inventoryItems as $item) {
                // Make sure we have a PlanInventory model instance
                if (is_array($item)) {
                    $item = PlanInventory::find($item['id'] ?? $item);
                }

                if ($item && $item->status === PlanInventory::STATUS_RESERVED) {
                    $item->markAsSold($userId);

                    Log::info('Inventory item sold', [
                        'inventory_id' => $item->id,
                        'plan_id' => $item->plan_id,
                        'user_id' => $userId,
                        'sold_at' => $item->sold_at,
                    ]);
                }
            }
        });
    }

    /**
     * Release inventory (for failed/cancelled purchases)
     */
    public function releaseInventory(array $inventoryItems): void
    {
        if (empty($inventoryItems)) {
            return;
        }

        DB::transaction(function () use ($inventoryItems) {
            foreach ($inventoryItems as $item) {
                // Make sure we have a PlanInventory model instance
                if (is_array($item)) {
                    $item = PlanInventory::find($item['id'] ?? $item);
                }

                if ($item && $item->status === PlanInventory::STATUS_RESERVED) {
                    $item->markAsAvailable();

                    Log::info('Inventory item released', [
                        'inventory_id' => $item->id,
                        'plan_id' => $item->plan_id,
                    ]);
                }
            }
        });
    }

    /**
     * Get inventory items for user
     */
    public function getUserInventory(int $userId)
    {
        return PlanInventory::with(['plan', 'plan.planType'])
            ->where('user_id', $userId)
            ->where('status', PlanInventory::STATUS_SOLD)
            ->orderBy('sold_at', 'desc')
            ->paginate(20);
    }

    /**
     * Get inventory item by code
     */
    public function getByCode(string $code): ?PlanInventory
    {
        return PlanInventory::with(['plan', 'user'])
            ->where('code', $code)
            ->first();
    }

    /**
     * Check if user owns inventory item
     */
    public function userOwnsInventory(int $userId, int $inventoryId): bool
    {
        return PlanInventory::where('id', $inventoryId)
            ->where('user_id', $userId)
            ->where('status', PlanInventory::STATUS_SOLD)
            ->exists();
    }
}
