<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlanInventory::with(['plan', 'plan.planType']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('code', 'like', "%{$search}%");
        }

        if ($request->has('plan_id')) {
            $query->where('plan_id', $request->get('plan_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        $inventories = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($inventories);
    }

    public function show(PlanInventory $inventory): JsonResponse
    {
        return response()->json([
            'data' => $inventory->load(['plan', 'plan.planType']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'code' => 'required|string|max:255',
            'status' => 'integer|in:1,2,3,4',
            'expires_at' => 'nullable|date',
            'meta_data' => 'nullable|array',
        ]);

        $inventory = PlanInventory::create($validated);

        return response()->json([
            'data' => $inventory->load(['plan']),
            'message' => 'Inventory item created successfully',
        ], 201);
    }

    public function update(Request $request, PlanInventory $inventory): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'sometimes|exists:plans,id',
            'code' => 'sometimes|string|max:255',
            'status' => 'integer|in:1,2,3,4',
            'expires_at' => 'nullable|date',
            'meta_data' => 'nullable|array',
        ]);

        $inventory->update($validated);

        return response()->json([
            'data' => $inventory->load(['plan']),
            'message' => 'Inventory item updated successfully',
        ]);
    }

    public function destroy(PlanInventory $inventory): JsonResponse
    {
        $inventory->delete();

        return response()->json([
            'message' => 'Inventory item deleted successfully',
        ]);
    }

    public function bulkImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'codes' => 'required|array|min:1',
            'codes.*' => 'required|string|max:255',
            'expires_at' => 'nullable|date',
            'skip_duplicates' => 'boolean',
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);
        $codes = $validated['codes'];
        $expiresAt = $validated['expires_at'] ?? null;
        $skipDuplicates = $validated['skip_duplicates'] ?? true;

        $imported = 0;
        $skipped = 0;

        DB::transaction(function () use ($plan, $codes, $expiresAt, $skipDuplicates, &$imported, &$skipped) {
            foreach ($codes as $code) {
                $exists = PlanInventory::where('plan_id', $plan->id)
                    ->where('code', $code)
                    ->exists();

                if ($exists) {
                    if ($skipDuplicates) {
                        $skipped++;

                        continue;
                    }
                }

                PlanInventory::create([
                    'plan_id' => $plan->id,
                    'code' => $code,
                    'status' => 1, // Available
                    'expires_at' => $expiresAt,
                ]);
                $imported++;
            }
        });

        return response()->json([
            'message' => "Import completed. Imported: {$imported}, Skipped: {$skipped}",
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:plan_inventories,id',
        ]);

        $deleted = PlanInventory::whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'message' => "{$deleted} inventory items deleted successfully",
            'deleted' => $deleted,
        ]);
    }
}
