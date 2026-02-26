<?php

namespace App\Jobs;

use App\Models\PlanInventory;
use App\Models\User;
use App\Services\DeliveryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $inventoryId;
    public int $userId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $inventoryId, int $userId)
    {
        $this->inventoryId = $inventoryId;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(DeliveryService $deliveryService): void
    {
        $inventory = PlanInventory::find($this->inventoryId);
        $user = User::find($this->userId);

        \Log::info('totnak');

        if (! $inventory || ! $user) {
            \Log::warning('ProcessDeliveryJob: Inventory or user not found', [
                'inventory_id' => $this->inventoryId,
                'user_id' => $this->userId,
            ]);
            return;
        }

        $deliveryService->processDelivery($inventory, $user);
    }
}
