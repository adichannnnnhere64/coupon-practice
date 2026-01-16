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
        $query = Plan::with(['planType', 'attributes', 'media'])
            ->where('is_active', true);

        // Filter by plan type
        if ($request->has('plan_type_id')) {
            $query->where('plan_type_id', $request->plan_type_id);
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('actual_price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('actual_price', '<=', $request->max_price);
        }

        $plans = $query->orderBy('actual_price')->get();

        return $this->success(PlanResource::collection($plans));
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
