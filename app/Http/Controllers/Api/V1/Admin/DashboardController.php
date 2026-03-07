<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Plan;
use App\Models\PlanInventory;
use App\Models\PlanType;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::whereNotNull('email_verified_at')->count();
        $totalCategories = Category::count();
        $totalPlanTypes = PlanType::count();
        $totalPlans = Plan::count();
        $totalCoupons = PlanInventory::count();
        $availableCoupons = PlanInventory::where('status', 1)->count();
        $soldCoupons = PlanInventory::where('status', 2)->count();

        return response()->json([
            'data' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_categories' => $totalCategories,
                'total_plan_types' => $totalPlanTypes,
                'total_plans' => $totalPlans,
                'total_coupons' => $totalCoupons,
                'available_coupons' => $availableCoupons,
                'sold_coupons' => $soldCoupons,
            ],
        ]);
    }
}
