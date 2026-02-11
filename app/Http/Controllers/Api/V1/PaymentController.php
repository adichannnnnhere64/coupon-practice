<?php

namespace App\Http\Controllers\Api\V1;

use Adichan\Payment\Interfaces\PaymentServiceInterface;
use Adichan\Payment\Models\PaymentGateway;
use Adichan\Payment\Models\PaymentTransaction;
use Adichan\Transaction\Models\Transaction;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanInventory;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Stripe\StripeClient;

class PaymentController extends Controller
{
    protected PaymentServiceInterface $paymentService;

    public function __construct(PaymentServiceInterface $paymentService, protected InventoryService $inventoryService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Create a transaction for payment
     */


    public function createTransaction(Request $request): JsonResponse
{
    $activeGateways = PaymentGateway::where('is_active', true)
        ->pluck('name')
        ->toArray();

    $validator = Validator::make($request->all(), [
        'amount' => 'required|numeric|min:0.01|max:10000',
        'gateway' => 'required|string|in:' . implode(',', $activeGateways),
        'currency' => 'string|size:3',
        'description' => 'string|max:255',
        'metadata' => 'array', // This expects array but client might send JSON string
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422);
    }

    $user = $request->user();

    try {
        // Verify gateway exists and is active
        $gateway = PaymentGateway::where('name', $request->gateway)
            ->where('is_active', true)
            ->first();

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway not available',
            ], 400);
        }

        // Get transaction repository
        $transactionRepo = app(\Adichan\Transaction\Interfaces\TransactionRepositoryInterface::class);

        // ============ SAFELY HANDLE REQUEST METADATA ============
        $requestMetadata = $request->metadata;

        // Convert to array if it's a JSON string
        if (is_string($requestMetadata)) {
            $requestMetadata = json_decode($requestMetadata, true) ?: [];
        } elseif (!is_array($requestMetadata)) {
            $requestMetadata = [];
        }

        \Log::info('Processed request metadata', ['metadata' => $requestMetadata]);
        // ========================================================

        // ============ INVENTORY CHECK ============
        $plan = null;
        if (isset($requestMetadata['purchase_type']) &&
            $requestMetadata['purchase_type'] === 'plan_purchase' &&
            isset($requestMetadata['plan_id'])) {

            $plan = Plan::find($requestMetadata['plan_id']);

            if ($plan) {
                // Check available inventory (status = 1)
                $availableCount = $plan->inventories()
                    ->where('status', PlanInventory::STATUS_AVAILABLE)
                    ->count();

                \Log::info('Inventory check:', [
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'inventory_enabled' => $plan->inventory_enabled,
                    'available_count' => $availableCount,
                ]);

                if ($plan->inventory_enabled && $availableCount < 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Plan is out of stock',
                        'data' => [
                            'available_stock' => $availableCount,
                            'plan_name' => $plan->name,
                        ],
                    ], 400);
                }
            }
        }
        // ==========================================

        // ============ PREPARE TRANSACTION METADATA ============
        $purchaseType = $requestMetadata['purchase_type'] ?? 'plan_purchase';

        $transactionMetadata = array_merge($requestMetadata, [
            'purchase_type' => $purchaseType,
            'user_email' => $user->email,
            'gateway' => $request->gateway,
            'created_at' => now()->toIso8601String(),
        ]);
        // ======================================================

        // Create a transaction record using polymorphic relationship
        $transaction = $transactionRepo->createForTransactionable($user, [
            'type' => 'credit_purchase',
            'amount' => $request->amount,
            'total' => $request->amount,
            'status' => 'pending',
            'currency' => $request->currency ?? 'USD',
            'description' => $request->description ?? "Credit purchase of {$request->amount} USD",
            'metadata' => $transactionMetadata,
        ]);

        \Log::info('Transaction created', [
            'transaction_id' => $transaction->id,
            'metadata' => $transaction->metadata
        ]);

        // ============ RESERVE INVENTORY ============
        if ($plan && $plan->inventory_enabled) {
            try {
                \Log::info('Attempting to reserve inventory', [
                    'transaction_id' => $transaction->id,
                    'plan_id' => $plan->id,
                ]);

                // Get available inventory items
                $availableItems = $plan->inventories()
                    ->where('status', PlanInventory::STATUS_AVAILABLE)
                    ->limit(1)
                    ->get();

                if ($availableItems->isEmpty()) {
                    throw new \Exception('No available inventory items found');
                }

                $reservedIds = [];

                foreach ($availableItems as $item) {
                    // Mark as reserved (status = 2)
                    $item->update([
                        'status' => PlanInventory::STATUS_RESERVED,
                        'meta_data' => array_merge($item->meta_data ?? [], [
                            'reserved_at' => now()->toIso8601String(),
                            'reservation_metadata' => [
                                'transaction_id' => $transaction->id,
                                'user_id' => $user->id,
                                'purchase_type' => 'plan_purchase',
                                'gateway' => $request->gateway,
                            ],
                        ]),
                    ]);

                    $reservedIds[] = $item->id;
                }

                \Log::info('Items reserved', ['reserved_ids' => $reservedIds]);

                // ============ SAFELY UPDATE TRANSACTION METADATA ============
                $currentMetadata = $transaction->metadata;

                // Convert to array if it's a JSON string
                if (is_string($currentMetadata)) {
                    $currentMetadata = json_decode($currentMetadata, true) ?: [];
                } elseif (!is_array($currentMetadata)) {
                    $currentMetadata = [];
                }

                $updatedMetadata = array_merge($currentMetadata, [
                    'reserved_inventory_ids' => $reservedIds,
                    'reserved_at' => now()->toIso8601String(),
                    'reserved_count' => count($reservedIds),
                ]);

                $transaction->update([
                    'metadata' => $updatedMetadata,
                ]);

                $transaction->refresh();
                // ============================================================

                \Log::info('Transaction metadata updated', [
                    'transaction_id' => $transaction->id,
                    'metadata' => $transaction->metadata,
                    'has_reserved_ids' => isset($transaction->metadata['reserved_inventory_ids']),
                    'reserved_ids' => $transaction->metadata['reserved_inventory_ids'] ?? [],
                ]);

            } catch (\Exception $e) {
                \Log::error('Inventory reservation failed', [
                    'transaction_id' => $transaction->id,
                    'plan_id' => $plan->id,
                    'error' => $e->getMessage(),
                ]);
                throw $e;
            }
        } else {
            \Log::info('Skipping inventory reservation', [
                'has_plan' => !is_null($plan),
                'inventory_enabled' => $plan ? $plan->inventory_enabled : false,
            ]);
        }
        // ==========================================

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => [
                'transaction_id' => $transaction->id,
                'amount' => $transaction->total,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at,
                'purchase_type' => $purchaseType,
                'credits' => $request->amount,
                'inventory_reserved' => isset($reservedIds) ? count($reservedIds) : 0,
            ],
        ], 201);

    } catch (\Exception $e) {
        Log::error('Transaction creation failed', [
            'user_id' => $user->id ?? null,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Failed to create transaction: ' . $e->getMessage(),
            'error' => $e->getMessage(),
        ], 500);
    }
}


    /**
     * Initiate a payment
     */
    public function initiate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|integer|exists:transactions,id',
            'gateway' => 'required|string',
            'return_url' => 'required|url',
            'cancel_url' => 'required|url',
            'description' => 'string|max:255',
            'customer_email' => 'email',
            'customer_name' => 'string|max:255',
            'currency' => 'string|size:3',
            'metadata' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            // Get transaction
            $transaction = Transaction::findOrFail($request->transaction_id);


            // Debug logging
            Log::info('Payment initiation debug', [
                'authenticated_user_id' => $user->id,
                'transaction_user_id' => $transaction->transactionable_id,
                'transaction_user_type' => $transaction->transactionable_type,
                'transaction_id' => $transaction->id,
            ]);

            // Verify transaction belongs to user (polymorphic check)
            if (! $transaction->transactionable ||
                $transaction->transactionable_type !== get_class($user) ||
                $transaction->transactionable_id !== $user->id) {

                Log::error('Unauthorized transaction access', [
                    'authenticated_user_id' => $user->id,
                    'authenticated_user_type' => get_class($user),
                    'transaction_user_id' => $transaction->transactionable_id,
                    'transaction_user_type' => $transaction->transactionable_type,
                    'transaction_id' => $transaction->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to transaction',
                ], 403);
            }

            // Check if transaction is already paid
            if ($transaction->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction already completed',
                ], 400);
            }

            // Verify gateway exists and is active
            $gateway = PaymentGateway::where('name', $request->gateway)
                ->where('is_active', true)
                ->first();

            if (! $gateway) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway not available',
                ], 400);
            }

            // Handle internal gateway (wallet) payments differently
            if ($gateway->name === 'internal') {
                return $this->handleInternalPayment($user, $transaction, $gateway, $request);
            }

            // Handle external gateways (Stripe, etc.)
            $options = [
                'return_url' => $request->return_url,
                'cancel_url' => $request->cancel_url,
                'description' => $request->description ?? $transaction->description ?? "Transaction #{$transaction->id}",
                'customer_email' => $request->customer_email ?? $user->email,
                'customer_name' => $request->customer_name ?? $user->name,
                'currency' => $request->currency ?? $transaction->currency ?? 'USD',
                'metadata' => array_merge($request->metadata ?? [], [
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'purpose' => 'credit_purchase',
                ]),
            ];

            // Add payment method if provided
            if ($request->has('payment_method_id') && $request->gateway === 'stripe') {
                $options['payment_method'] = $request->payment_method_id;
            }

            // Initiate payment
            $paymentResponse = $this->paymentService
                ->setGateway($gateway->name)
                ->pay($transaction, $options);

            // Check payment response
            if (! $paymentResponse->isSuccessful()) {
                return response()->json([
                    'success' => false,
                    'message' => $paymentResponse->getErrorMessage() ?? 'Payment initiation failed',
                    'data' => $paymentResponse->getRawResponse(),
                ], 400);
            }

            // Get response data
            $responseData = $paymentResponse->getRawResponse();

            // For Stripe, we might need to handle payment intents differently
            if ($gateway->name === 'stripe') {
                $requiresAction = false;
                $actionData = null;

                if (isset($responseData['status']) && in_array($responseData['status'], ['requires_action', 'requires_payment_method'])) {
                    $requiresAction = true;
                    $actionData = [
                        'client_secret' => $responseData['client_secret'] ?? null,
                        'payment_method' => $responseData['payment_method'] ?? null,
                        'status' => $responseData['status'] ?? null,
                    ];
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment initiated successfully',
                    'data' => [
                        'payment_reference' => $paymentResponse->getGatewayReference(),
                        'requires_action' => $requiresAction,
                        'redirect_url' => $paymentResponse->getRedirectUrl(),
                        'action_data' => $actionData,
                        'payment_id' => null,
                    ],
                ]);
            }

            // For other gateways
            return response()->json([
                'success' => true,
                'message' => 'Payment initiated successfully',
                'data' => [
                    'payment_reference' => $paymentResponse->getGatewayReference(),
                    'requires_action' => $paymentResponse->requiresAction(),
                    'redirect_url' => $paymentResponse->getRedirectUrl(),
                    'action_data' => $paymentResponse->getActionData(),
                    'payment_id' => null,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Payment initiation failed', [
                'transaction_id' => $request->transaction_id,
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment initiation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle internal wallet payment
     */

    /**
     * Handle internal wallet payment
     */
    protected function handleInternalPayment($user, $transaction, $gateway, $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check if user has enough wallet balance
            $walletService = app(\Adichan\Wallet\Services\WalletService::class);
            $balance = $walletService->getBalance($user);

            if ($balance < $transaction->total) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient wallet balance',
                    'data' => [
                        'balance' => $balance,
                        'required' => $transaction->total,
                        'shortage' => $transaction->total - $balance,
                    ],
                ], 400);
            }

            // Prepare options for payment service with payer information
            // The internal payment driver expects the actual user model as payer
            $options = [
                'payer' => $user, // Pass the actual user model
                'description' => $request->description ?? $transaction->description ?? "Transaction #{$transaction->id}",
                'currency' => $request->currency ?? $transaction->currency ?? 'USD',
                'metadata' => array_merge($request->metadata ?? [], [
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'purpose' => 'credit_purchase',
                ]),
            ];

            // Use the payment service for internal payments
            $paymentResponse = $this->paymentService
                ->setGateway($gateway->name)
                ->pay($transaction, $options);

            if (! $paymentResponse->isSuccessful()) {
                throw new \Exception($paymentResponse->getErrorMessage() ?? 'Wallet payment failed');
            }

            // Get the payment reference
            $paymentReference = $paymentResponse->getGatewayReference();

            // Update transaction status
            $transaction->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment completed successfully from wallet',
                'data' => [
                    'payment_reference' => $paymentReference,
                    'requires_action' => false,
                    'redirect_url' => null,
                    'action_data' => null,
                    'payment_id' => null,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Internal payment failed', [
                'transaction_id' => $transaction->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal payment failed: '.$e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify a payment
     */

    /**
 * Verify a payment
 */
public function verify(Request $request): JsonResponse
{
    // Get all active gateways for validation
    $activeGateways = PaymentGateway::where('is_active', true)
        ->pluck('name')
        ->toArray();

    $validator = Validator::make($request->all(), [
        'payment_reference' => 'required|string',
        'gateway' => 'required|string|in:' . implode(',', $activeGateways),
        'transaction_id' => 'sometimes|integer|exists:transactions,id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422);
    }

    $user = $request->user();

    try {
        // Verify gateway exists and is active
        $gateway = PaymentGateway::where('name', $request->gateway)
            ->where('is_active', true)
            ->first();

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway not available',
            ], 400);
        }

        // Special handling for internal (wallet) gateway
        if ($gateway->name === 'internal') {
            return $this->verifyInternalPayment($request, $user, $gateway);
        }

        // Find payment record for external gateways
        $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $request->payment_reference)
            ->orWhere('id', $request->payment_reference)
            ->first();

        if (!$paymentRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found',
            ], 404);
        }

        // Verify user owns this payment using polymorphic relationship
        if ($paymentRecord->transaction &&
            ($paymentRecord->transaction->transactionable_id !== $user->id ||
             $paymentRecord->transaction->transactionable_type !== get_class($user))) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to payment',
            ], 403);
        }

        // Check if payment is already verified
        if ($paymentRecord->status === 'completed' && $paymentRecord->verified_at) {
            return response()->json([
                'success' => true,
                'message' => 'Payment already verified',
                'data' => [
                    'is_verified' => true,
                    'status' => $paymentRecord->status,
                    'verified_at' => $paymentRecord->verified_at->toIso8601String(),
                    'transaction_status' => $paymentRecord->transaction?->status,
                    'gateway' => $gateway->name,
                ],
            ]);
        }

        // Verify payment with gateway
        $verification = $this->paymentService
            ->setGateway($gateway->name)
            ->verify($request->payment_reference, $request->all());

        // Check if payment is verified
        if (!$verification->isVerified()) {
            $status = $verification->getStatus();
            $verificationData = $verification->getVerificationData();

            $statusMessages = [
                'requires_payment_method' => 'Payment method is required',
                'requires_confirmation' => 'Payment requires confirmation',
                'requires_action' => 'Payment requires additional action',
                'processing' => 'Payment is processing',
                'requires_capture' => 'Payment requires capture',
                'canceled' => 'Payment was cancelled',
                'failed' => 'Payment failed',
            ];

            $message = $statusMessages[$status] ?? 'Payment not verified';

            return response()->json([
                'success' => false,
                'message' => $message,
                'data' => [
                    'is_verified' => false,
                    'status' => $status,
                    'verified_at' => null,
                    'transaction_status' => $verification->getTransaction()?->status ?? 'pending',
                    'gateway' => $gateway->name,
                    'verification_data' => $verificationData,
                ]
            ], 400);
        }

        // ============ PAYMENT IS VERIFIED - UPDATE TRANSACTION AND SELL INVENTORY ============
        $transaction = $verification->getTransaction();
        if ($transaction) {
            $transaction->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Update payment record
            $paymentRecord->update([
                'status' => 'completed',
                'verified_at' => now(),
            ]);

            // ============ SELL INVENTORY - Mark reserved items as sold ============
            $metadata = $transaction->metadata ?? [];

            // Log for debugging
            \Log::info('Processing inventory sale after payment verification', [
                'transaction_id' => $transaction->id,
                'metadata' => $metadata,
                'gateway' => $gateway->name,
                'payment_reference' => $request->payment_reference,
            ]);

            if (isset($metadata['purchase_type']) && $metadata['purchase_type'] === 'plan_purchase') {
                if (isset($metadata['reserved_inventory_ids']) && !empty($metadata['reserved_inventory_ids'])) {

                    \Log::info('Found reserved inventory IDs', [
                        'reserved_ids' => $metadata['reserved_inventory_ids'],
                    ]);

                    // Get all reserved inventory items
                    $inventoryItems = PlanInventory::whereIn('id', $metadata['reserved_inventory_ids'])
                        ->where('status', PlanInventory::STATUS_RESERVED) // status = 2
                        ->get();

                    \Log::info('Found reserved inventory items', [
                        'count' => $inventoryItems->count(),
                        'items' => $inventoryItems->pluck('id')->toArray(),
                    ]);

                    if ($inventoryItems->isNotEmpty()) {
                        foreach ($inventoryItems as $inventoryItem) {
                            // Safely handle meta_data
                            $currentMetaData = $inventoryItem->meta_data;

                            // Ensure it's an array
                            if (is_string($currentMetaData)) {
                                $decoded = json_decode($currentMetaData, true);
                                $currentMetaData = is_array($decoded) ? $decoded : [];
                            } elseif (!is_array($currentMetaData)) {
                                $currentMetaData = [];
                            }

                            // Mark as SOLD (status = 3)
                            $inventoryItem->update([
                                'status' => PlanInventory::STATUS_SOLD, // 3
                                'user_id' => $transaction->transactionable_id,
                                'sold_at' => now(),
                                'meta_data' => array_merge($currentMetaData, [
                                    'sold_at' => now()->toIso8601String(),
                                    'sale_metadata' => [
                                        'transaction_id' => $transaction->id,
                                        'payment_reference' => $request->payment_reference,
                                        'gateway' => $gateway->name,
                                        'verified_at' => now()->toIso8601String(),
                                    ],
                                ]),
                            ]);

                            \Log::info('Inventory item marked as SOLD', [
                                'inventory_id' => $inventoryItem->id,
                                'plan_id' => $inventoryItem->plan_id,
                                'user_id' => $transaction->transactionable_id,
                                'sold_at' => $inventoryItem->sold_at,
                            ]);
                        }

                        // Update plan inventory counts
                        if ($inventoryItems->first()->plan) {
                            $inventoryItems->first()->plan->updateInventoryCounts();

                            \Log::info('Plan inventory counts updated', [
                                'plan_id' => $inventoryItems->first()->plan_id,
                                'available' => $inventoryItems->first()->plan->available_stock,
                                'sold' => $inventoryItems->first()->plan->sold_stock,
                            ]);
                        }
                    } else {
                        \Log::warning('No reserved inventory items found to mark as sold', [
                            'reserved_ids' => $metadata['reserved_inventory_ids'],
                        ]);
                    }
                }
            }
            // =========================================================================
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully',
            'data' => [
                'is_verified' => true,
                'status' => $verification->getStatus(),
                'verified_at' => $verification->getVerifiedAt()?->toIso8601String(),
                'transaction_status' => $transaction?->status,
                'gateway' => $gateway->name,
                'verification_data' => $verification->getVerificationData(),
                'inventory_sold' => isset($inventoryItems) ? $inventoryItems->count() : 0,
            ],
        ]);

    } catch (\Exception $e) {
        Log::error('Payment verification failed', [
            'payment_reference' => $request->payment_reference,
            'gateway' => $request->gateway,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Payment verification failed: ' . $e->getMessage(),
            'error' => $e->getMessage(),
        ], 500);
    }
}


    /**
 * Verify internal (wallet) payment
 */
protected function verifyInternalPayment(Request $request, $user, $gateway): JsonResponse
{
    try {
        // For internal payments, we need to get transaction_id from request
        $transactionId = $request->transaction_id;

        if (!$transactionId) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction ID is required for wallet verification',
            ], 400);
        }

        // Find the transaction
        $transaction = Transaction::find($transactionId);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        // Verify transaction belongs to user
        if (!$transaction->transactionable ||
            $transaction->transactionable_type !== get_class($user) ||
            $transaction->transactionable_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to transaction',
            ], 403);
        }

        // Check if transaction is already completed
        if ($transaction->status === 'completed') {
            return response()->json([
                'success' => true,
                'message' => 'Payment already completed',
                'data' => [
                    'is_verified' => true,
                    'status' => 'completed',
                    'verified_at' => $transaction->completed_at?->toIso8601String(),
                    'transaction_status' => $transaction->status,
                    'gateway' => $gateway->name,
                ],
            ]);
        }

        DB::beginTransaction();

        try {
            // For internal payments, the payment should have been completed during initiation
            $transaction->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Find or create payment record
            $paymentRecord = PaymentTransaction::updateOrCreate(
                ['transaction_id' => $transactionId],
                [
                    'gateway_id' => $gateway->id,
                    'gateway_name' => $gateway->name,
                    'gateway_transaction_id' => 'WALLET_' . $transactionId . '_' . time(),
                    'amount' => $transaction->total,
                    'currency' => $transaction->currency,
                    'status' => 'completed',
                    'payment_method' => 'wallet',
                    'payer_info' => [
                        'owner_type' => get_class($user),
                        'owner_id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                    ],
                    'verified_at' => now(),
                    'metadata' => $transaction->metadata ?? [],
                ]
            );

            // ============ SELL INVENTORY FOR WALLET PAYMENT ============
            $metadata = $transaction->metadata ?? [];

            if (isset($metadata['purchase_type']) && $metadata['purchase_type'] === 'plan_purchase') {
                if (isset($metadata['reserved_inventory_ids']) && !empty($metadata['reserved_inventory_ids'])) {

                    $inventoryItems = PlanInventory::whereIn('id', $metadata['reserved_inventory_ids'])
                        ->where('status', PlanInventory::STATUS_RESERVED)
                        ->get();

                    if ($inventoryItems->isNotEmpty()) {
                        foreach ($inventoryItems as $inventoryItem) {
                            $currentMetaData = $inventoryItem->meta_data;

                            if (is_string($currentMetaData)) {
                                $decoded = json_decode($currentMetaData, true);
                                $currentMetaData = is_array($decoded) ? $decoded : [];
                            } elseif (!is_array($currentMetaData)) {
                                $currentMetaData = [];
                            }

                            $inventoryItem->update([
                                'status' => PlanInventory::STATUS_SOLD,
                                'user_id' => $user->id,
                                'sold_at' => now(),
                                'meta_data' => array_merge($currentMetaData, [
                                    'sold_at' => now()->toIso8601String(),
                                    'sale_metadata' => [
                                        'transaction_id' => $transaction->id,
                                        'gateway' => 'wallet',
                                        'verified_at' => now()->toIso8601String(),
                                    ],
                                ]),
                            ]);
                        }

                        if ($inventoryItems->first()->plan) {
                            $inventoryItems->first()->plan->updateInventoryCounts();
                        }
                    }
                }
            }
            // ==========================================================

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Wallet payment verified successfully',
                'data' => [
                    'is_verified' => true,
                    'status' => 'completed',
                    'verified_at' => $paymentRecord->verified_at?->toIso8601String() ?? now()->toIso8601String(),
                    'transaction_status' => 'completed',
                    'gateway' => $gateway->name,
                    'payment_reference' => $paymentRecord->gateway_transaction_id,
                    'inventory_sold' => isset($inventoryItems) ? $inventoryItems->count() : 0,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

    } catch (\Exception $e) {
        Log::error('Internal payment verification failed', [
            'transaction_id' => $request->transaction_id ?? null,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Wallet payment verification failed: ' . $e->getMessage(),
            'error' => $e->getMessage(),
        ], 500);
    }
}

    /**
     * Handle payment webhook
     */
    public function handleWebhook(Request $request, string $gateway): JsonResponse
    {
        try {
            $payload = $request->all();

            Log::info("Webhook received for gateway: {$gateway}", [
                'payload' => $payload,
                'headers' => $request->headers->all(),
            ]);

            // Process webhook
            $result = $this->paymentService->processWebhook($gateway, $payload);

            return response()->json([
                'success' => $result->shouldProcess(),
                'message' => $result->shouldProcess() ? 'Webhook processed' : 'Webhook ignored',
                'data' => $result->getResponse(),
            ]);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'gateway' => $gateway,
                'error' => $e->getMessage(),
                'payload' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing failed',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get user's payment transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = $request->get('per_page', 20);

        // Query transactions for this user using polymorphic relationship
        $query = PaymentTransaction::with(['gateway', 'transaction'])
            ->whereHas('transaction', function ($q) use ($user) {
                $q->where('transactionable_id', $user->id)
                    ->where('transactionable_type', get_class($user));
            });

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('gateway')) {
            $query->where('gateway_name', $request->gateway);
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $transactions->getCollection()->transform(function ($transaction) {
            return [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'gateway' => $transaction->gateway_name,
                'gateway_display_name' => $transaction->gateway?->meta['display_name'] ?? $transaction->gateway_name,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
                'payment_method' => $transaction->payment_method,
                'description' => $transaction->transaction?->description,
                'created_at' => $transaction->created_at,
                'verified_at' => $transaction->verified_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * Get payment transaction details
     */
    public function transactionDetails(string $id): JsonResponse
    {
        $user = request()->user();

        $transaction = PaymentTransaction::with(['gateway', 'transaction'])
            ->where('id', $id)
            ->whereHas('transaction', function ($q) use ($user) {
                $q->where('transactionable_id', $user->id)
                    ->where('transactionable_type', get_class($user));
            })
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'gateway_id' => $transaction->gateway_id,
                'gateway_name' => $transaction->gateway_name,
                'gateway_display_name' => $transaction->gateway?->meta['display_name'] ?? $transaction->gateway_name,
                'gateway_transaction_id' => $transaction->gateway_transaction_id,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
                'payment_method' => $transaction->payment_method,
                'description' => $transaction->transaction?->description,
                'payer_info' => $transaction->payer_info,
                'webhook_received' => $transaction->webhook_received,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
                'verified_at' => $transaction->verified_at,
                'transaction' => $transaction->transaction ? [
                    'id' => $transaction->transaction->id,
                    'description' => $transaction->transaction->description,
                    'amount' => $transaction->transaction->amount,
                    'status' => $transaction->transaction->status,
                    'created_at' => $transaction->transaction->created_at,
                ] : null,
            ],
        ]);
    }

    /**
     * Payment callback handler (for redirects)
     */
    public function callback(Request $request): JsonResponse
    {
        $paymentId = $request->get('paymentId');
        $gateway = $request->get('gateway');
        $token = $request->get('token');

        Log::info('Payment callback received', [
            'payment_id' => $paymentId,
            'gateway' => $gateway,
            'token' => $token,
            'all_params' => $request->all(),
        ]);

        // This would typically redirect to frontend success page
        // For now, return JSON response
        return response()->json([
            'success' => true,
            'message' => 'Payment callback received',
            'data' => [
                'payment_id' => $paymentId,
                'gateway' => $gateway,
                'status' => 'callback_received',
            ],
        ]);
    }

    /**
     * Payment cancel handler
     */
    public function cancel(Request $request): JsonResponse
    {
        $paymentId = $request->get('paymentId');
        $gateway = $request->get('gateway');
        $transactionId = $request->get('transactionId');

        Log::info('Payment cancelled', [
            'payment_id' => $paymentId,
            'gateway' => $gateway,
            'transaction_id' => $transactionId,
        ]);

        if ($transactionId) {
            $transaction = Transaction::find($transactionId);
            if ($transaction && isset($transaction->metadata['reserved_inventory_ids'])) {
                $inventoryItems = PlanInventory::whereIn('id', $transaction->metadata['reserved_inventory_ids'])
                    ->where('status', 'reserved')
                    ->get();

                $this->inventoryService->releaseInventory($inventoryItems->toArray());
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Payment cancelled by user',
            'data' => [
                'payment_id' => $paymentId,
                'gateway' => $gateway,
                'status' => 'cancelled',
            ],
        ]);
    }

    /**
     * Payment success handler
     */
    public function success(Request $request): JsonResponse
    {
        $paymentId = $request->get('paymentId');
        $gateway = $request->get('gateway');
        $transactionId = $request->get('transactionId');

        Log::info('Payment success', [
            'payment_id' => $paymentId,
            'gateway' => $gateway,
            'transaction_id' => $transactionId,
        ]);

        // Find and verify the payment
        $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $paymentId)
            ->orWhere('id', $paymentId)
            ->first();

        if ($paymentRecord) {
            // Mark as verified
            $paymentRecord->markAsVerified(['callback_verified' => true]);

            // Complete transaction
            if ($paymentRecord->transaction) {
                $paymentRecord->transaction->complete();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment completed successfully',
            'data' => [
                'payment_id' => $paymentId,
                'transaction_id' => $transactionId,
                'gateway' => $gateway,
                'status' => 'completed',
                'verified' => true,
            ],
        ]);
    }

    /**
     * Refund a payment
     */
    public function refund(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_reference' => 'required|string',
            'gateway' => 'required|string',
            'amount' => 'numeric|min:0.01',
            'reason' => 'string|in:duplicate,fraudulent,requested_by_customer',
            'notes' => 'string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            // Find payment record
            $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $request->payment_reference)
                ->orWhere('id', $request->payment_reference)
                ->first();

            if (! $paymentRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not found',
                ], 404);
            }

            // Verify user owns this payment
            if ($paymentRecord->transaction && $paymentRecord->transaction->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to payment',
                ], 403);
            }

            // Process refund
            $refundResponse = $this->paymentService
                ->setGateway($request->gateway)
                ->refund($request->payment_reference, $request->amount);

            if (! $refundResponse->isSuccessful()) {
                return response()->json([
                    'success' => false,
                    'message' => $refundResponse->getErrorMessage() ?? 'Refund failed',
                    'data' => $refundResponse->getRawResponse(),
                ], 400);
            }

            // Update payment record
            $paymentRecord->update([
                'status' => 'refunded',
                'metadata' => array_merge($paymentRecord->metadata ?? [], [
                    'refunded_at' => now()->toIso8601String(),
                    'refund_amount' => $request->amount ?? $paymentRecord->amount,
                    'refund_reason' => $request->reason,
                    'refund_notes' => $request->notes,
                    'refund_reference' => $refundResponse->getGatewayReference(),
                ]),
            ]);

            // If internal gateway, add funds back to wallet
            if ($paymentRecord->gateway_name === 'internal' && $paymentRecord->payer_info) {
                $payerInfo = $paymentRecord->payer_info;
                if (isset($payerInfo['owner_type']) && isset($payerInfo['owner_id'])) {
                    $owner = $payerInfo['owner_type']::find($payerInfo['owner_id']);
                    if ($owner) {
                        $walletService = app(\Adichan\Wallet\Services\WalletService::class);
                        $walletService->addFunds(
                            $owner,
                            $request->amount ?? $paymentRecord->amount,
                            "Refund for payment #{$paymentRecord->id}",
                            ['payment_id' => $paymentRecord->id]
                        );
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Refund processed successfully',
                'data' => [
                    'refund_id' => $refundResponse->getGatewayReference(),
                    'refund_amount' => $request->amount ?? $paymentRecord->amount,
                    'status' => 'refunded',
                    'payment_id' => $paymentRecord->id,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Refund failed', [
                'payment_reference' => $request->payment_reference,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Refund failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPaymentMethods(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            // Return empty array if user hasn't set up Stripe yet
            if (! $user->stripe_customer_id) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $stripeSecret = config('services.stripe.secret');

            if (! $stripeSecret) {
                Log::error('Stripe secret key not configured when fetching methods');

                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway not configured',
                ], 500);
            }

            $stripe = new StripeClient($stripeSecret);

            $paymentMethods = $stripe->paymentMethods->all([
                'customer' => $user->stripe_customer_id,
                'type' => 'card',
            ]);

            $methods = collect($paymentMethods->data)->map(function ($pm) use ($user) {
                return [
                    'id' => $pm->id,
                    'brand' => $pm->card->brand,
                    'last4' => $pm->card->last4,
                    'exp_month' => $pm->card->exp_month,
                    'exp_year' => $pm->card->exp_year,
                    'is_default' => $pm->id === $user->default_payment_method_id,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $methods->values()->toArray(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch payment methods', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return empty array on error for better UX
            return response()->json([
                'success' => true,
                'data' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Add a new payment method
     */
    public function addPaymentMethod(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_method_id' => 'required|string',
            'set_as_default' => 'boolean',
            'gateway' => 'required|string|in:stripe',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            // Get Stripe secret key from config
            $stripeSecret = config('services.stripe.secret');

            if (! $stripeSecret) {
                Log::error('Stripe secret key not configured');

                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway not configured properly',
                ], 500);
            }

            $stripe = new StripeClient($stripeSecret);

            // Create Stripe customer if doesn't exist
            if (! $user->stripe_customer_id) {
                $customer = $stripe->customers->create([
                    'email' => $user->email,
                    'name' => $user->name,
                    'metadata' => [
                        'user_id' => $user->id,
                        'app_user' => true,
                    ],
                ]);

                $user->update(['stripe_customer_id' => $customer->id]);
                $user->refresh();
            }

            // Log for debugging
            Log::info('Adding payment method', [
                'user_id' => $user->id,
                'stripe_customer_id' => $user->stripe_customer_id,
                'payment_method_id' => $request->payment_method_id,
            ]);

            // Attach payment method to customer
            $stripe->paymentMethods->attach($request->payment_method_id, [
                'customer' => $user->stripe_customer_id,
            ]);

            // Set as default if requested or if it's the first payment method
            $shouldSetAsDefault = $request->get('set_as_default', false) ||
                                 ($user->default_payment_method_id === null);

            if ($shouldSetAsDefault) {
                $stripe->customers->update($user->stripe_customer_id, [
                    'invoice_settings' => [
                        'default_payment_method' => $request->payment_method_id,
                    ],
                ]);

                $user->update(['default_payment_method_id' => $request->payment_method_id]);
            }

            // Get the payment method details
            $paymentMethod = $stripe->paymentMethods->retrieve($request->payment_method_id);

            return response()->json([
                'success' => true,
                'message' => 'Payment method added successfully',
                'data' => [
                    'payment_method_id' => $request->payment_method_id,
                    'brand' => $paymentMethod->card->brand,
                    'last4' => $paymentMethod->card->last4,
                    'exp_month' => $paymentMethod->card->exp_month,
                    'exp_year' => $paymentMethod->card->exp_year,
                    'is_default' => $shouldSetAsDefault,
                ],
            ]);

        } catch (\Stripe\Exception\CardException $e) {
            Log::error('Stripe card error', [
                'user_id' => $user->id,
                'error' => $e->getError()->message,
                'code' => $e->getError()->code,
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getError()->message,
            ], 400);

        } catch (\Stripe\Exception\InvalidRequestException $e) {
            Log::error('Stripe invalid request', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid payment method',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Failed to add payment method', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add payment method',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a payment method
     */
    public function removePaymentMethod(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));

            // Verify the payment method belongs to this customer
            $paymentMethod = $stripe->paymentMethods->retrieve($id);

            if ($paymentMethod->customer !== $user->stripe_customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            // Detach the payment method
            $stripe->paymentMethods->detach($id);

            // Clear default if this was the default method
            if ($user->default_payment_method_id === $id) {
                $user->update(['default_payment_method_id' => null]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment method removed successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to remove payment method', [
                'user_id' => $user->id,
                'payment_method_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove payment method',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set a payment method as default
     */
    public function setDefaultPaymentMethod(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));

            // Verify the payment method belongs to this customer
            $paymentMethod = $stripe->paymentMethods->retrieve($id);

            if ($paymentMethod->customer !== $user->stripe_customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            // Set as default in Stripe
            $stripe->customers->update($user->stripe_customer_id, [
                'invoice_settings' => [
                    'default_payment_method' => $id,
                ],
            ]);

            // Update in database
            $user->update(['default_payment_method_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Default payment method updated',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to set default payment method', [
                'user_id' => $user->id,
                'payment_method_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update default payment method',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment gateway configuration
     */
    public function getGatewayConfig(Request $request): JsonResponse
    {
        try {
            $gateway = PaymentGateway::where('name', 'stripe')
                ->where('is_active', true)
                ->first();

            if (! $gateway) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stripe gateway not configured',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'public_key' => $gateway->credentials['public_key'] ?? config('services.stripe.key'),
                    'gateway_name' => $gateway->name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get gateway config',
            ], 500);
        }
    }

    public function checkPlanInventory($planId): JsonResponse
{
    $plan = Plan::withCount([
        'inventories as available_stock' => function($query) {
            $query->where('status', PlanInventory::STATUS_AVAILABLE);
        },
        'inventories as reserved_stock' => function($query) {
            $query->where('status', PlanInventory::STATUS_RESERVED);
        },
        'inventories as sold_stock' => function($query) {
            $query->where('status', PlanInventory::STATUS_SOLD);
        }
    ])->findOrFail($planId);

    return response()->json([
        'success' => true,
        'data' => [
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
            'inventory_enabled' => $plan->inventory_enabled,
            'in_stock' => $plan->in_stock,
            'is_low_stock' => $plan->is_low_stock,
            'is_out_of_stock' => $plan->is_out_of_stock,
            'available_stock' => $plan->available_stock,
            'reserved_stock' => $plan->reserved_stock,
            'sold_stock' => $plan->sold_stock,
            'total_stock' => $plan->total_stock,
        ]
    ]);
}
}
