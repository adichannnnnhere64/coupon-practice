<?php

namespace App\Services;

use App\Models\PlanInventory;
use App\Repositories\PlanInventoryRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Str;

class PlanInventoryService
{
    public function __construct(
        protected PlanInventoryRepository $repository
    ) {
    }

    public function addInventory(int $planId, string $code, array $additionalData = []): PlanInventory
    {
        $data = array_merge([
            'plan_id' => $planId,
            'code' => $code,
            'status' => 'available',
        ], $additionalData);

        return $this->repository->create($data);
    }

    public function bulkAddInventory(int $planId, array $codes, array $additionalData = []): SupportCollection
    {
        $inventories = [];

        foreach ($codes as $code) {
            $inventories[] = array_merge([
                'plan_id' => $planId,
                'code' => $code,
                'status' => 'available',
            ], $additionalData);
        }

        return $this->repository->bulkCreate($inventories);
    }

    public function generateAndAddInventory(int $planId, int $quantity, string $prefix = ''): SupportCollection
    {
        $codes = [];

        for ($i = 0; $i < $quantity; $i++) {
            $codes[] = $prefix . strtoupper(Str::random(12));
        }

        return $this->bulkAddInventory($planId, $codes);
    }

    public function getAvailableInventory(int $planId, int $limit = null): Collection
    {
        return $this->repository->getAvailableByPlan($planId, $limit);
    }

    public function reserveInventory(string $code): PlanInventory
    {
        $inventory = $this->repository->findByCode($code);

        if (!$inventory) {
            throw new \Exception('Inventory not found');
        }

        if ($inventory->status !== 'available') {
            throw new \Exception('Inventory is not available');
        }

        return $this->repository->updateStatus($inventory, 'reserved');
    }

    public function sellInventory(string $code): PlanInventory
    {
        $inventory = $this->repository->findByCode($code);

        if (!$inventory) {
            throw new \Exception('Inventory not found');
        }

        if (!in_array($inventory->status, ['available', 'reserved'])) {
            throw new \Exception('Inventory cannot be sold');
        }

        return $this->repository->markAsSold($inventory);
    }

    public function getStockLevel(int $planId): array
    {
        return $this->repository->getStockLevel($planId);
    }

    public function updateInventoryStatus(string $code, string $status): PlanInventory
    {
        $inventory = $this->repository->findByCode($code);

        if (!$inventory) {
            throw new \Exception('Inventory not found');
        }

        return $this->repository->updateStatus($inventory, $status);
    }
}
