<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlanType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlanType::with('category')->withCount('plans');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        $planTypes = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($planTypes);
    }

    public function show(PlanType $planType): JsonResponse
    {
        return response()->json([
            'data' => $planType->load(['category', 'plans']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $planType = PlanType::create($validated);

        return response()->json([
            'data' => $planType->load('category'),
            'message' => 'Plan type created successfully',
        ], 201);
    }

    public function update(Request $request, PlanType $planType): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|exists:categories,id',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $planType->update($validated);

        return response()->json([
            'data' => $planType->load('category'),
            'message' => 'Plan type updated successfully',
        ]);
    }

    public function destroy(PlanType $planType): JsonResponse
    {
        $planType->delete();

        return response()->json([
            'message' => 'Plan type deleted successfully',
        ]);
    }

    public function toggleStatus(PlanType $planType): JsonResponse
    {
        $planType->is_active = ! $planType->is_active;
        $planType->save();

        return response()->json([
            'data' => $planType,
            'message' => 'Plan type status updated successfully',
        ]);
    }
}
