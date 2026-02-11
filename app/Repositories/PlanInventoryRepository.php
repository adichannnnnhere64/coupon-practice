<?php

namespace App\Repositories;

use App\Models\PlanInventory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class PlanInventoryRepository
{
    public function __construct(protected PlanInventory $model)
    {
    }

    public function create(array $data): PlanInventory
    {
        return $this->model->create($data);
    }

    public function bulkCreate(array $inventories): SupportCollection
    {
        $created = collect();
        foreach ($inventories as $inventory) {
            $created->push($this->model->create($inventory));
        }
        return $created;
    }

    public function getAvailableByPlan(int $planId, int $limit = null): Collection
    {
        $query = $this->model->where('plan_id', $planId)
            ->where('status', PlanInventory::STATUS_AVAILABLE)
            ->orderBy('created_at');

        if ($limit) {
            $query->limit($limit);
        }

        return $query->get();
    }

    public function findByCode(string $code): ?PlanInventory
    {
        return $this->model->where('code', $code)->first();
    }

    public function updateStatus(PlanInventory $inventory, string $status): PlanInventory
    {
        $inventory->update(['status' => $status]);
        return $inventory->fresh();
    }

    public function markAsSold(PlanInventory $inventory): PlanInventory
    {
        $inventory->update([
            'status' => 'sold',
            'sold_at' => now(),
        ]);
        return $inventory->fresh();
    }

    public function getStockLevel(int $planId): array
    {
        $inventories = $this->model->where('plan_id', $planId)->get();

        return [
            'total' => $inventories->count(),
            'available' => $inventories->where('status', PlanInventory::STATUS_AVAILABLE)->count(),
            'sold' => $inventories->where('status', 'sold')->count(),
            'reserved' => $inventories->where('status', 'reserved')->count(),
            'expired' => $inventories->where('status', 'expired')->count(),
            'damaged' => $inventories->where('status', 'damaged')->count(),
        ];
    }
}
