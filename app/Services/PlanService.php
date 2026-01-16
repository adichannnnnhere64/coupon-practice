<?php

namespace App\Services;

use App\Models\Plan;
use App\Repositories\PlanRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PlanService
{
    public function __construct(
        protected PlanRepository $repository
    ) {
    }

    public function getAllPlans(array $filters = []): Collection
    {
        return $this->repository->all($filters);
    }

    public function getPlan(int $id): ?Plan
    {
        return $this->repository->find($id);
    }

    public function createPlan(array $data): Plan
    {
        return DB::transaction(function () use ($data) {
            $attributes = $data['attributes'] ?? [];
            unset($data['attributes']);

            $plan = $this->repository->create($data);

            if (!empty($attributes)) {
                $this->attachAttributesToPlan($plan, $attributes);
            }

            return $plan->fresh(['planType', 'attributes']);
        });
    }

    public function updatePlan(int $id, array $data): Plan
    {
        return DB::transaction(function () use ($id, $data) {
            $plan = $this->repository->find($id);

            if (!$plan) {
                throw new \Exception('Plan not found');
            }

            $attributes = $data['attributes'] ?? null;
            unset($data['attributes']);

            $plan = $this->repository->update($plan, $data);

            if ($attributes !== null) {
                $this->attachAttributesToPlan($plan, $attributes);
            }

            return $plan->fresh(['planType', 'attributes']);
        });
    }

    public function deletePlan(int $id): bool
    {
        $plan = $this->repository->find($id);

        if (!$plan) {
            throw new \Exception('Plan not found');
        }

        // Check if plan has inventory
        if ($plan->inventories()->exists()) {
            throw new \Exception('Cannot delete plan with existing inventory');
        }

        return $this->repository->delete($plan);
    }

    public function attachAttributesToPlan(Plan $plan, array $attributes): void
    {
        $formattedAttributes = [];

        foreach ($attributes as $attributeId => $data) {
            $formattedAttributes[$attributeId] = [
                'value' => $data['value'] ?? null,
                'is_unlimited' => $data['is_unlimited'] ?? false,
            ];
        }

        $this->repository->attachAttributes($plan, $formattedAttributes);
    }

    public function getPlansByType(int $planTypeId): Collection
    {
        return $this->repository->getByPlanType($planTypeId);
    }

    public function getActivePlans(): Collection
    {
        return $this->repository->getActivePlans();
    }

    public function addMediaToPlan(Plan $plan, $file, string $collection = 'images'): void
    {
        $plan->addMedia($file)->toMediaCollection($collection);
    }
}
