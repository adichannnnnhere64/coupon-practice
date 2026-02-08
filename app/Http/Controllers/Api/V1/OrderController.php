<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Adichan\Transaction\Interfaces\TransactionRepositoryInterface;
use Adichan\Payment\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderController extends Controller
{
    protected $transactionRepository;

    public function __construct(TransactionRepositoryInterface $transactionRepository)
    {
        $this->transactionRepository = $transactionRepository;
    }

    /**
     * Get user's orders (transactions)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|string|in:pending,completed,cancelled,processing',
            'search' => 'sometimes|string|max:255',
            'date_from' => 'sometimes|date',
            'date_to' => 'sometimes|date|after_or_equal:date_from',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'sort_by' => 'sometimes|string|in:date_desc,date_asc,total_desc,total_asc',
            'page' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            $sortBy = $request->get('sort_by', 'date_desc');

            // Base query for user's transactions
            $query = \Adichan\Transaction\Models\Transaction::with(['transactionable', 'items'])
                ->where('transactionable_id', $user->id)
                ->where('transactionable_type', get_class($user));

            // Apply status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Apply search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('id', 'like', "%{$search}%");
                });
            }

            // Apply date range filter
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Apply sorting
            switch ($sortBy) {
                case 'date_asc':
                    $query->orderBy('created_at', 'asc');
                    break;
                case 'total_desc':
                    $query->orderBy('total', 'desc');
                    break;
                case 'total_asc':
                    $query->orderBy('total', 'asc');
                    break;
                default: // date_desc
                    $query->orderBy('created_at', 'desc');
                    break;
            }

            // Get paginated results
            $transactions = $query->paginate($perPage, ['*'], 'page', $page);

            // Transform transactions
            $formattedTransactions = $transactions->map(function ($transaction) {
                // Get payment info if exists
                $payment = PaymentTransaction::where('transaction_id', $transaction->id)->first();

                // Get items info
                $items = $transaction->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->itemable->getName() ?? 'Item',
                        'quantity' => $item->quantity,
                        'price' => $item->price_at_time,
                        'subtotal' => $item->subtotal,
                    ];
                });

                return [
                    'id' => $transaction->id,
                    'order_id' => 'ORD-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT),
                    'status' => $transaction->status,
                    'total' => (float) $transaction->total,
                    'description' => $transaction->description,
                    'date' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'formatted_date' => $transaction->created_at->format('M d, Y H:i'),
                    'items_count' => $transaction->items->count(),
                    'items' => $items,
                    'payment_method' => $payment ? $this->getPaymentMethodInfo($payment) : null,
                    'payment_status' => $payment ? $payment->status : null,
                    'metadata' => $transaction->metadata ?? [],
                ];
            });

            // Calculate stats
            $stats = $this->calculateUserStats($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'orders' => $formattedTransactions,
                    'stats' => $stats,
                    'pagination' => [
                        'current_page' => $transactions->currentPage(),
                        'total_pages' => $transactions->lastPage(),
                        'total_items' => $transactions->total(),
                        'per_page' => $transactions->perPage(),
                        'has_more' => $transactions->hasMorePages(),
                    ],
                ],
                'message' => 'Orders retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve orders', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get order details
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        try {
            $transaction = \Adichan\Transaction\Models\Transaction::with(['transactionable', 'items', 'items.itemable'])
                ->where('id', $id)
                ->where('transactionable_id', $user->id)
                ->where('transactionable_type', get_class($user))
                ->firstOrFail();

            // Get payment info
            $payment = PaymentTransaction::with('gateway')
                ->where('transaction_id', $transaction->id)
                ->first();

            // Format items
            $items = $transaction->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'itemable_type' => $item->itemable_type,
                    'itemable_id' => $item->itemable_id,
                    'name' => $item->itemable->getName() ?? 'Item',
                    'description' => $item->itemable->getDescription() ?? null,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->price_at_time,
                    'subtotal' => (float) $item->subtotal,
                    'created_at' => $item->created_at,
                ];
            });

            // Format transaction
            $order = [
                'id' => $transaction->id,
                'order_id' => 'ORD-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT),
                'status' => $transaction->status,
                'total' => (float) $transaction->total,
                'description' => $transaction->description,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
                'completed_at' => $transaction->completed_at,
                'metadata' => $transaction->metadata ?? [],
                'items' => $items,
                'payment' => $payment ? [
                    'id' => $payment->id,
                    'gateway' => $payment->gateway_name,
                    'gateway_display_name' => $payment->gateway?->meta['display_name'] ?? $payment->gateway_name,
                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                    'gateway_transaction_id' => $payment->gateway_transaction_id,
                    'payer_info' => $payment->payer_info,
                    'verified_at' => $payment->verified_at,
                    'created_at' => $payment->created_at,
                ] : null,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $order,
                'message' => 'Order details retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve order details', [
                'user_id' => $user->id,
                'order_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Order not found or access denied',
            ], 404);
        }
    }

    /**
     * Create a new order (transaction)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.itemable_type' => 'required|string',
            'items.*.itemable_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Create transaction
            $transaction = $this->transactionRepository->createForTransactionable($user, [
                'status' => 'pending',
                'total' => 0,
                'description' => $request->description ?? 'New order',
                'metadata' => $request->metadata ?? [],
            ]);

            // Add items to transaction
            $total = 0;
            foreach ($request->items as $itemData) {
                $itemableClass = $itemData['itemable_type'];
                $itemableId = $itemData['itemable_id'];

                // Find the itemable object
                $itemable = $itemableClass::find($itemableId);

                if (!$itemable) {
                    throw new \Exception("Item not found: {$itemableClass} with ID {$itemableId}");
                }

                $price = $itemData['price'] ?? $itemable->getPrice();
                $quantity = $itemData['quantity'];

                $transaction->addItem($itemable, $quantity, $price);
                $total += ($price * $quantity);
            }

            // Update transaction total
            $transaction->calculateTotal();

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $transaction->id,
                    'order_number' => 'ORD-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT),
                    'status' => $transaction->status,
                    'total' => $transaction->total,
                    'items_count' => $transaction->items->count(),
                    'created_at' => $transaction->created_at,
                ],
                'message' => 'Order created successfully',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create order', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        try {
            $transaction = \Adichan\Transaction\Models\Transaction::where('id', $id)
                ->where('transactionable_id', $user->id)
                ->where('transactionable_type', get_class($user))
                ->firstOrFail();

            // Check if transaction can be cancelled
            if ($transaction->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel a completed order',
                ], 400);
            }

            if ($transaction->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order is already cancelled',
                ], 400);
            }

            // Cancel transaction
            $transaction->cancel();

            // If there's a payment, try to refund
            $payment = PaymentTransaction::where('transaction_id', $transaction->id)->first();
            if ($payment && $payment->status === 'completed') {
                // You would typically initiate a refund here
                // $refundResponse = $paymentService->refund($payment->gateway_transaction_id, $transaction->total);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => [
                    'order_id' => $transaction->id,
                    'status' => $transaction->status,
                    'cancelled_at' => now()->toDateTimeString(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to cancel order', [
                'user_id' => $user->id,
                'order_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
            ], 500);
        }
    }

    /**
     * Export orders to CSV
     */
    public function export(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'format' => 'required|string|in:csv,json',
            'status' => 'sometimes|string|in:pending,completed,cancelled,processing',
            'date_from' => 'sometimes|date',
            'date_to' => 'sometimes|date|after_or_equal:date_from',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Get filtered transactions
            $query = \Adichan\Transaction\Models\Transaction::with(['items', 'transactionable'])
                ->where('transactionable_id', $user->id)
                ->where('transactionable_type', get_class($user));

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $transactions = $query->orderBy('created_at', 'desc')->get();

            // Prepare export data
            $exportData = $transactions->map(function ($transaction) {
                $payment = PaymentTransaction::where('transaction_id', $transaction->id)->first();

                return [
                    'Order ID' => 'ORD-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT),
                    'Date' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'Status' => ucfirst($transaction->status),
                    'Description' => $transaction->description,
                    'Items Count' => $transaction->items->count(),
                    'Total Amount' => number_format($transaction->total, 2),
                    'Payment Method' => $payment ? $payment->gateway_name : 'N/A',
                    'Payment Status' => $payment ? $payment->status : 'N/A',
                ];
            });

            if ($request->format === 'csv') {
                // In a real implementation, you would generate and return a CSV file
                // For now, return JSON with the data that would be in CSV
                return response()->json([
                    'success' => true,
                    'data' => [
                        'format' => 'csv',
                        'filename' => 'orders_export_' . date('Y-m-d_H-i-s') . '.csv',
                        'records_count' => $exportData->count(),
                        'csv_data' => $exportData->toArray(),
                    ],
                    'message' => 'Export data prepared successfully',
                ]);
            }

            // Return JSON format
            return response()->json([
                'success' => true,
                'data' => [
                    'format' => 'json',
                    'records_count' => $exportData->count(),
                    'orders' => $exportData,
                ],
                'message' => 'Export data prepared successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to export orders', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export orders',
            ], 500);
        }
    }

    /**
     * Calculate user order statistics
     */
    private function calculateUserStats($user): array
    {
        $totalOrders = \Adichan\Transaction\Models\Transaction::where('transactionable_id', $user->id)
            ->where('transactionable_type', get_class($user))
            ->count();

        $totalRevenue = \Adichan\Transaction\Models\Transaction::where('transactionable_id', $user->id)
            ->where('transactionable_type', get_class($user))
            ->where('status', 'completed')
            ->sum('total');

        $completedOrders = \Adichan\Transaction\Models\Transaction::where('transactionable_id', $user->id)
            ->where('transactionable_type', get_class($user))
            ->where('status', 'completed')
            ->count();

        $pendingOrders = \Adichan\Transaction\Models\Transaction::where('transactionable_id', $user->id)
            ->where('transactionable_type', get_class($user))
            ->where('status', 'pending')
            ->count();

        return [
            'total_orders' => $totalOrders,
            'total_revenue' => (float) $totalRevenue,
            'completed_orders' => $completedOrders,
            'pending_orders' => $pendingOrders,
            'cancelled_orders' => \Adichan\Transaction\Models\Transaction::where('transactionable_id', $user->id)
                ->where('transactionable_type', get_class($user))
                ->where('status', 'cancelled')
                ->count(),
        ];
    }

    /**
     * Get payment method info
     */
    private function getPaymentMethodInfo(PaymentTransaction $payment): string
    {
        if (!$payment->payment_method) {
            return ucfirst($payment->gateway_name);
        }

        if ($payment->payment_method === 'card' && isset($payment->payer_info['card_last4'])) {
            return 'Card •••• ' . $payment->payer_info['card_last4'];
        }

        if ($payment->payment_method === 'wallet') {
            return 'Wallet Balance';
        }

        return ucfirst($payment->payment_method);
    }
}
