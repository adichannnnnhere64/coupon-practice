<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Adichan\Payment\Interfaces\PaymentServiceInterface;
use Adichan\Transaction\Models\Transaction;
use Adichan\Wallet\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected PaymentServiceInterface $paymentService,
        protected WalletService $walletService
    ) {}

    /**
     * Handle Stripe webhook
     */
    public function stripe(Request $request)
    {
        try {
            $payload = $request->all();

            Log::info('Stripe webhook received', [
                'type' => $payload['type'] ?? 'unknown',
            ]);

            // Process webhook through payment service
            $result = $this->paymentService->processWebhook('stripe', $payload);

            if (!$result->shouldProcess()) {
                Log::info('Webhook not processed', [
                    'event_type' => $result->getEventType(),
                    'reason' => 'shouldProcess returned false',
                ]);

                return response()->json(['received' => true]);
            }

            // Handle successful payment
            if (in_array($result->getEventType(), ['payment_intent.succeeded', 'charge.succeeded'])) {
                $this->handleSuccessfulPayment($result);
            }

            Log::info('Webhook processed successfully', [
                'event_type' => $result->getEventType(),
                'reference' => $result->getGatewayReference(),
            ]);

            return response()->json(['received' => true]);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return 200 to prevent Stripe from retrying
            return response()->json(['error' => $e->getMessage()], 200);
        }
    }

    /**
     * Handle successful payment and add credits
     */
    protected function handleSuccessfulPayment($result)
    {
        try {
            $payment = \Adichan\Payment\Models\PaymentTransaction::where(
                'gateway_transaction_id',
                $result->getGatewayReference()
            )->first();

            if (!$payment || !$payment->transaction) {
                Log::warning('Payment or transaction not found for webhook', [
                    'reference' => $result->getGatewayReference(),
                ]);
                return;
            }

            $transaction = $payment->transaction;

            // Check if already processed
            if ($transaction->status === 'completed' ||
                isset($transaction->meta['credits_added'])) {
                Log::info('Payment already processed', [
                    'transaction_id' => $transaction->id,
                ]);
                return;
            }

            // Get meta data
            $meta = $transaction->meta ?? [];
            $userId = $meta['user_id'] ?? null;
            $credits = $meta['credits'] ?? null;

            if (!$userId || !$credits) {
                Log::error('Missing user or credits in transaction meta', [
                    'transaction_id' => $transaction->id,
                    'meta' => $meta,
                ]);
                return;
            }

            $user = \App\Models\User::find($userId);

            if (!$user) {
                Log::error('User not found', [
                    'user_id' => $userId,
                ]);
                return;
            }

            // Add credits in a transaction
            DB::transaction(function () use ($user, $credits, $transaction, $payment) {
                $this->walletService->addFunds(
                    $user,
                    $credits,
                    "Credits purchased via Stripe - \${$credits} (Transaction #{$transaction->id})",
                    [
                        'type' => 'credit_purchase',
                        'transaction_id' => $transaction->id,
                        'payment_id' => $payment->id,
                        'via_webhook' => true,
                    ]
                );

                // Update transaction
                $transaction->update([
                    'meta' => array_merge($transaction->meta ?? [], [
                        'credits_added' => $credits,
                        'completed_at' => now()->toIso8601String(),
                        'completed_via' => 'webhook',
                    ]),
                ]);
            });

            Log::info('Credits added via webhook', [
                'user_id' => $user->id,
                'credits' => $credits,
                'transaction_id' => $transaction->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to add credits via webhook', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle PayPal webhook (if needed)
     */
    public function paypal(Request $request)
    {
        try {
            $payload = $request->all();

            Log::info('PayPal webhook received', [
                'event_type' => $payload['event_type'] ?? 'unknown',
            ]);

            $result = $this->paymentService->processWebhook('paypal', $payload);

            if ($result->shouldProcess()) {
                $this->handleSuccessfulPayment($result);
            }

            return response()->json(['received' => true]);

        } catch (\Exception $e) {
            Log::error('PayPal webhook processing failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => $e->getMessage()], 200);
        }
    }
}
