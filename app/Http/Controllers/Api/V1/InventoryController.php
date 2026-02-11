<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanInventory;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get user's purchased inventory items
     */
    public function myInventory(Request $request): JsonResponse
    {
        $user = $request->user();

        $inventory = $this->inventoryService->getUserInventory($user->id);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $inventory->items(),
                'pagination' => [
                    'current_page' => $inventory->currentPage(),
                    'total' => $inventory->total(),
                    'per_page' => $inventory->perPage(),
                    'last_page' => $inventory->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Get inventory item details
     */
    public function show(string $code): JsonResponse
    {
        $user = request()->user();

        $inventory = $this->inventoryService->getByCode($code);

        if (!$inventory) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory item not found',
            ], 404);
        }

        // Check if user owns this item
        if ($inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $inventory->id,
                'code' => $inventory->code,
                'plan' => [
                    'id' => $inventory->plan->id,
                    'name' => $inventory->plan->name,
                    'description' => $inventory->plan->description,
                ],
                'purchased_at' => $inventory->purchased_at?->toIso8601String(),
                'sold_at' => $inventory->sold_at?->toIso8601String(),
                'expires_at' => $inventory->expires_at?->toIso8601String(),
                'coupon_url' => $inventory->coupon_url,
                'meta_data' => $inventory->meta_data,
            ],
        ]);
    }

    /**
     * Check plan availability
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'plan_id' => 'required|exists:plans,id',
            'quantity' => 'integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $plan = Plan::find($request->plan_id);
        $quantity = $request->get('quantity', 1);

        return response()->json([
            'success' => true,
            'data' => [
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'inventory_enabled' => $plan->inventory_enabled,
                'in_stock' => $plan->in_stock,
                'is_low_stock' => $plan->is_low_stock,
                'is_out_of_stock' => $plan->is_out_of_stock,
                'available_stock' => $plan->availableStock,
                'requested_quantity' => $quantity,
                'has_sufficient_stock' => $plan->hasAvailableInventory($quantity),
            ],
        ]);
    }
}
