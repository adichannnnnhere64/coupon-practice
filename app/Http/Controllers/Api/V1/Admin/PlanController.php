<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Plan::with(['planType', 'planType.category'])
            ->withCount([
                'inventories',
                'inventories as available_count' => function ($q) {
                    $q->where('status', 1);
                },
            ]);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('plan_type_id')) {
            $query->where('plan_type_id', $request->get('plan_type_id'));
        }

        if ($request->has('category_id')) {
            $query->whereHas('planType', function ($q) use ($request) {
                $q->where('category_id', $request->get('category_id'));
            });
        }

        $plans = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($plans);
    }

    public function show(Plan $plan): JsonResponse
    {
        return response()->json([
            'data' => $plan->load(['planType', 'planType.category', 'attributes', 'deliveryMethods']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'plan_type_id' => 'required|exists:plan_types,id',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'actual_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'meta_data' => 'nullable|array',
        ]);

        $plan = Plan::create($validated);

        return response()->json([
            'data' => $plan->load(['planType']),
            'message' => 'Plan created successfully',
        ], 201);
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'plan_type_id' => 'sometimes|exists:plan_types,id',
            'description' => 'nullable|string',
            'base_price' => 'sometimes|numeric|min:0',
            'actual_price' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
            'meta_data' => 'nullable|array',
        ]);

        $plan->update($validated);

        return response()->json([
            'data' => $plan->load(['planType']),
            'message' => 'Plan updated successfully',
        ]);
    }

    public function destroy(Plan $plan): JsonResponse
    {
        $plan->delete();

        return response()->json([
            'message' => 'Plan deleted successfully',
        ]);
    }

    public function toggleStatus(Plan $plan): JsonResponse
    {
        $plan->is_active = ! $plan->is_active;
        $plan->save();

        return response()->json([
            'data' => $plan,
            'message' => 'Plan status updated successfully',
        ]);
    }
}
