<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Adichan\Payment\Interfaces\PaymentServiceInterface;
use Adichan\Payment\Models\PaymentGateway;
use Adichan\Payment\Models\PaymentTransaction;
use Adichan\Transaction\Models\Transaction;
use Adichan\Wallet\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    protected PaymentServiceInterface $paymentService;

    public function __construct(PaymentServiceInterface $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Initiate a payment
     */
    public function initiate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|string|exists:transactions,id',
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

            // Verify transaction belongs to user
            if ($transaction->user_id !== $user->id) {
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

            if (!$gateway) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway not available',
                ], 400);
            }

            // Prepare payment options
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

            // If internal gateway, add payer info
            if ($gateway->driver === 'internal') {
                $options['payer'] = $user;
            }

            // Initiate payment
            $paymentResponse = $this->paymentService
                ->setGateway($gateway->name)
                ->pay($transaction, $options);

            // Check payment response
            if (!$paymentResponse->isSuccessful()) {
                return response()->json([
                    'success' => false,
                    'message' => $paymentResponse->getErrorMessage() ?? 'Payment initiation failed',
                    'data' => $paymentResponse->getRawResponse(),
                ], 400);
            }

            // Get payment record if created
            $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $paymentResponse->getGatewayReference())
                ->orWhere('transaction_id', $transaction->id)
                ->latest()
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated successfully',
                'data' => [
                    'payment_reference' => $paymentResponse->getGatewayReference(),
                    'requires_action' => $paymentResponse->requiresAction(),
                    'redirect_url' => $paymentResponse->getRedirectUrl(),
                    'action_data' => $paymentResponse->getActionData(),
                    'payment_id' => $paymentRecord?->id,
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
     * Verify a payment
     */
    public function verify(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_reference' => 'required|string',
            'gateway' => 'required|string',
            'transaction_id' => 'sometimes|string|exists:transactions,id',
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

            // Find payment record
            $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $request->payment_reference)
                ->orWhere('id', $request->payment_reference)
                ->first();

            if ($paymentRecord) {
                // Verify user owns this payment
                if ($paymentRecord->transaction && $paymentRecord->transaction->user_id !== $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized access to payment',
                    ], 403);
                }
            }

            // Verify payment with gateway
            $verification = $this->paymentService
                ->setGateway($gateway->name)
                ->verify($request->payment_reference, $request->all());

            // Update transaction status if verified
            if ($verification->isVerified() && $verification->getTransaction()) {
                $transaction = $verification->getTransaction();
                $transaction->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $verification->isVerified() ? 'Payment verified' : 'Payment not verified',
                'data' => [
                    'is_verified' => $verification->isVerified(),
                    'status' => $verification->getStatus(),
                    'verified_at' => $verification->getVerifiedAt()?->toIso8601String(),
                    'transaction_status' => $verification->getTransaction()?->status,
                    'gateway' => $verification->getGateway(),
                    'verification_data' => $verification->getVerificationData(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Payment verification failed', [
                'payment_reference' => $request->payment_reference,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
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

        $query = PaymentTransaction::with(['gateway', 'transaction'])
            ->whereHas('transaction', function ($q) use ($user) {
                $q->where('user_id', $user->id);
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
                $q->where('user_id', $user->id);
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

        Log::info('Payment cancelled', [
            'payment_id' => $paymentId,
            'gateway' => $gateway,
        ]);

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

            if (!$paymentRecord) {
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

            if (!$refundResponse->isSuccessful()) {
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
}
