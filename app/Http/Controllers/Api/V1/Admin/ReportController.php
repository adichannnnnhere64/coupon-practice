<?php

namespace App\Http\Controllers\Api\V1\Admin;

use Adichan\Wallet\Models\WalletTransaction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.plan.planType'])
            ->where('status', 'completed');

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->get('from_date'));
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->get('to_date'));
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($orders);
    }

    public function walletTransactions(Request $request): JsonResponse
    {
        $query = WalletTransaction::with(['wallet.user']);

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->get('from_date'));
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->get('to_date'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($transactions);
    }

    public function revenue(Request $request): JsonResponse
    {
        $fromDate = $request->get('from_date', now()->subMonth()->format('Y-m-d'));
        $toDate = $request->get('to_date', now()->format('Y-m-d'));

        $dailyRevenue = Order::where('status', 'completed')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $totalRevenue = Order::where('status', 'completed')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->sum('total_amount');

        $totalOrders = Order::where('status', 'completed')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->count();

        return response()->json([
            'data' => [
                'daily_revenue' => $dailyRevenue,
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    public function userReport(Request $request): JsonResponse
    {
        $query = User::withCount(['orders' => function ($q) {
            $q->where('status', 'completed');
        }])
            ->withSum(['orders' => function ($q) {
                $q->where('status', 'completed');
            }], 'total_amount');

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->get('from_date'));
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->get('to_date'));
        }

        $users = $query->orderBy('orders_count', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($users);
    }
}
