<?php

namespace App\Repositories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Collection;

class PlanRepository
{
    public function __construct(protected Plan $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->with(['planType', 'attributes']);

        if (isset($filters['plan_type_id'])) {
            $query->where('plan_type_id', $filters['plan_type_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['min_price'])) {
            $query->where('actual_price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('actual_price', '<=', $filters['max_price']);
        }

        return $query->get();
    }

    public function find(int $id): ?Plan
    {
        return $this->model->with(['planType', 'attributes', 'media'])->find($id);
    }

    public function create(array $data): Plan
    {
        return $this->model->create($data);
    }

    public function update(Plan $plan, array $data): Plan
    {
        $plan->update($data);

        return $plan->fresh();
    }

    public function delete(Plan $plan): bool
    {
        return $plan->delete();
    }

    public function attachAttributes(Plan $plan, array $attributes): void
    {
        $plan->attributes()->sync($attributes);
    }

    public function getByPlanType(int $planTypeId): Collection
    {
        return $this->model->where('plan_type_id', $planTypeId)
            ->with(['attributes'])
            ->get();
    }

    public function getActivePlans(): Collection
    {
        return $this->model->where('is_active', true)
            ->with(['planType', 'attributes'])
            ->get();
    }
}
