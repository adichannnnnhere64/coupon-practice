<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Plan::with(['planType', 'attributes', 'media']);

        // Filter by active status (default to active only)
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        } else {
            $query->where('is_active', true);
        }

        // Filter by plan type
        if ($request->has('plan_type_id')) {
            $query->where('plan_type_id', $request->plan_type_id);
        }

        // Filter by category (through plan_type's categories relationship)
        if ($request->has('category_id')) {
            $query->whereHas('planType.categories', function ($q) use ($request) {
                $q->where('categories.id', $request->category_id);
            });
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('actual_price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('actual_price', '<=', $request->max_price);
        }

        // Search by name or description
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['name', 'actual_price', 'base_price', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = min($request->get('per_page', 12), 100);
        $plans = $query->paginate($perPage);

        return $this->paginated(PlanResource::collection($plans));
    }

    public function show(Plan $plan): JsonResponse
    {
        $plan->load(['planType', 'attributes', 'media']);

        return $this->success(new PlanResource($plan));
    }

    public function inventory(Plan $plan, Request $request): JsonResponse
    {
        $availableStock = $plan->availableInventories()
            ->when($request->has('limit'), function ($query) use ($request) {
                $query->limit($request->limit);
            })
            ->get();

        return $this->success([
            'plan' => new PlanResource($plan),
            'stock_summary' => [
                'total' => $plan->total_stock,
                'available' => $plan->available_stock,
                'available_codes' => $availableStock->pluck('code'),
            ],
        ]);
    }
}
