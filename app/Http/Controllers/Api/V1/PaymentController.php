<?php

namespace App\Http\Controllers\Api\V1;

use Adichan\Payment\Interfaces\PaymentServiceInterface;
use Adichan\Payment\Models\PaymentGateway;
use Adichan\Payment\Models\PaymentTransaction;
use Adichan\Transaction\Models\Transaction;
use Adichan\Wallet\Services\WalletService;
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
    public function __construct(
        protected PaymentServiceInterface $paymentService,
        protected InventoryService $inventoryService,
        protected WalletService $walletService
    ) {}

    public function createTransaction(Request $request): JsonResponse
    {
        $activeGateways = PaymentGateway::where('is_active', true)->pluck('name')->toArray();

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01|max:10000',
            'gateway' => 'required|string|in:'.implode(',', $activeGateways),
            'currency' => 'string|size:3',
            'description' => 'string|max:255',
            'metadata' => 'array',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        $user = $request->user();

        try {
            $gateway = PaymentGateway::where('name', $request->gateway)->where('is_active', true)->first();
            if (! $gateway) {
                return $this->error('Payment gateway not available', 400);
            }

            $metadata = $this->normalizeMetadata($request->metadata);
            $purchaseType = $metadata['purchase_type'] ?? $metadata['type'] ?? 'credit_purchase';

            // Inventory check for plan purchases
            $plan = null;
            $reservedIds = [];
            if ($purchaseType === 'plan_purchase' && isset($metadata['plan_id'])) {
                $plan = Plan::find($metadata['plan_id']);
                if ($plan && $plan->inventory_enabled) {
                    $available = $plan->inventories()->where('status', PlanInventory::STATUS_AVAILABLE)->count();
                    if ($available < 1) {
                        return $this->error('Plan is out of stock', 400, ['available_stock' => $available]);
                    }
                }
            }

            $transactionRepo = app(\Adichan\Transaction\Interfaces\TransactionRepositoryInterface::class);
            $transactionMetadata = array_merge($metadata, [
                'purchase_type' => $purchaseType,
                'user_email' => $user->email,
                'gateway' => $request->gateway,
            ]);

            $transaction = $transactionRepo->createForTransactionable($user, [
                'type' => $purchaseType,
                'amount' => $request->amount,
                'total' => $request->amount,
                'status' => 'pending',
                'currency' => $request->currency ?? 'USD',
                'description' => $request->description ?? "Purchase of {$request->amount} USD",
                'metadata' => $transactionMetadata,
            ]);

            // Reserve inventory for plan purchases
            if ($plan && $plan->inventory_enabled) {
                $item = $plan->inventories()->where('status', PlanInventory::STATUS_AVAILABLE)->first();
                if ($item) {
                    $item->update([
                        'status' => PlanInventory::STATUS_RESERVED,
                        'meta_data' => array_merge($item->meta_data ?? [], [
                            'reserved_at' => now()->toIso8601String(),
                            'transaction_id' => $transaction->id,
                            'user_id' => $user->id,
                        ]),
                    ]);
                    $reservedIds[] = $item->id;

                    $transaction->update([
                        'metadata' => array_merge($transaction->metadata ?? [], [
                            'reserved_inventory_ids' => $reservedIds,
                        ]),
                    ]);
                }
            }

            return $this->success('Transaction created successfully', [
                'transaction_id' => $transaction->id,
                'amount' => $transaction->total,
                'currency' => $transaction->currency,
                'status' => $transaction->status,
                'purchase_type' => $purchaseType,
                'inventory_reserved' => count($reservedIds),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Transaction creation failed', ['error' => $e->getMessage()]);

            return $this->error('Failed to create transaction: '.$e->getMessage(), 500);
        }
    }

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
            return $this->validationError($validator);
        }

        $user = $request->user();

        try {
            $transaction = Transaction::findOrFail($request->transaction_id);

            if (! $this->userOwnsTransaction($user, $transaction)) {
                return $this->error('Unauthorized access to transaction', 403);
            }

            if ($transaction->status === 'completed') {
                return $this->error('Transaction already completed', 400);
            }

            $gateway = PaymentGateway::where('name', $request->gateway)->where('is_active', true)->first();
            if (! $gateway) {
                return $this->error('Payment gateway not available', 400);
            }

            if ($gateway->name === 'internal') {
                return $this->handleInternalPayment($user, $transaction, $gateway, $request);
            }

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
                ]),
            ];

            if ($request->has('payment_method_id') && $request->gateway === 'stripe') {
                $options['payment_method'] = $request->payment_method_id;
            }

            $paymentResponse = $this->paymentService->setGateway($gateway->name)->pay($transaction, $options);

            if (! $paymentResponse->isSuccessful()) {
                return $this->error($paymentResponse->getErrorMessage() ?? 'Payment initiation failed', 400);
            }

            $responseData = $paymentResponse->getRawResponse();
            $actionData = null;
            $requiresAction = false;

            if ($gateway->name === 'stripe' && isset($responseData['status']) &&
                in_array($responseData['status'], ['requires_action', 'requires_payment_method'])) {
                $requiresAction = true;
                $actionData = [
                    'client_secret' => $responseData['client_secret'] ?? null,
                    'payment_method' => $responseData['payment_method'] ?? null,
                    'status' => $responseData['status'] ?? null,
                ];
            }

            return $this->success('Payment initiated successfully', [
                'payment_reference' => $paymentResponse->getGatewayReference(),
                'requires_action' => $requiresAction,
                'redirect_url' => $paymentResponse->getRedirectUrl(),
                'action_data' => $actionData,
            ]);

        } catch (\Exception $e) {
            Log::error('Payment initiation failed', ['error' => $e->getMessage()]);

            return $this->error('Payment initiation failed: '.$e->getMessage(), 500);
        }
    }

    protected function handleInternalPayment($user, $transaction, $gateway, $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $balance = $this->walletService->getBalance($user);
            if ($balance < $transaction->total) {
                return $this->error('Insufficient wallet balance', 400, [
                    'balance' => $balance,
                    'required' => $transaction->total,
                ]);
            }

            $options = [
                'payer' => $user,
                'description' => $request->description ?? $transaction->description ?? "Transaction #{$transaction->id}",
                'currency' => $request->currency ?? $transaction->currency ?? 'USD',
                'metadata' => array_merge($request->metadata ?? [], [
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                ]),
            ];

            $paymentResponse = $this->paymentService->setGateway($gateway->name)->pay($transaction, $options);

            if (! $paymentResponse->isSuccessful()) {
                throw new \Exception($paymentResponse->getErrorMessage() ?? 'Wallet payment failed');
            }

            $transaction->update(['status' => 'completed', 'completed_at' => now()]);

            // Sell inventory for plan purchases
            $metadata = $transaction->metadata ?? [];
            $inventorySold = 0;
            if (($metadata['purchase_type'] ?? null) === 'plan_purchase') {
                $inventorySold = $this->sellReservedInventory($metadata, $user->id);
            }

            DB::commit();

            return $this->success('Payment completed successfully from wallet', [
                'payment_reference' => $paymentResponse->getGatewayReference(),
                'requires_action' => false,
                'inventory_sold' => $inventorySold,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Internal payment failed', ['error' => $e->getMessage()]);

            return $this->error('Internal payment failed: '.$e->getMessage(), 500);
        }
    }

    public function verify(Request $request): JsonResponse
    {
        $activeGateways = PaymentGateway::where('is_active', true)->pluck('name')->toArray();

        $validator = Validator::make($request->all(), [
            'payment_reference' => 'required|string',
            'gateway' => 'required|string|in:'.implode(',', $activeGateways),
            'transaction_id' => 'sometimes|integer|exists:transactions,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        $user = $request->user();

        try {
            $gateway = PaymentGateway::where('name', $request->gateway)->where('is_active', true)->first();
            if (! $gateway) {
                return $this->error('Payment gateway not available', 400);
            }

            if ($gateway->name === 'internal') {
                return $this->verifyInternalPayment($request, $user, $gateway);
            }

            $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $request->payment_reference)
                ->orWhere('id', $request->payment_reference)
                ->first();

            if (! $paymentRecord) {
                return $this->error('Payment record not found', 404);
            }

            if ($paymentRecord->transaction && ! $this->userOwnsTransaction($user, $paymentRecord->transaction)) {
                return $this->error('Unauthorized access to payment', 403);
            }

            if ($paymentRecord->status === 'completed' && $paymentRecord->verified_at) {
                return $this->success('Payment already verified', [
                    'is_verified' => true,
                    'status' => $paymentRecord->status,
                    'verified_at' => $paymentRecord->verified_at->toIso8601String(),
                ]);
            }

            $verification = $this->paymentService->setGateway($gateway->name)->verify($request->payment_reference, $request->all());

            if (! $verification->isVerified()) {
                return $this->error($this->getVerificationErrorMessage($verification->getStatus()), 400, [
                    'is_verified' => false,
                    'status' => $verification->getStatus(),
                ]);
            }

            $transaction = $verification->getTransaction();
            $inventorySold = 0;
            $creditsAdded = null;

            if ($transaction) {
                $transaction->update(['status' => 'completed', 'completed_at' => now()]);
                $paymentRecord->update(['status' => 'completed', 'verified_at' => now()]);

                $metadata = $transaction->metadata ?? [];

                // Handle plan purchases - sell inventory
                if (($metadata['purchase_type'] ?? null) === 'plan_purchase') {
                    $inventorySold = $this->sellReservedInventory($metadata, $user->id);
                }

                // Handle credit purchases - add credits to wallet
                if (($metadata['type'] ?? $metadata['purchase_type'] ?? null) === 'credit_purchase') {
                    $creditsAdded = $this->addCreditsToWallet($transaction, $user, $gateway, $request->payment_reference);
                }
            }

            return $this->success('Payment verified successfully', [
                'is_verified' => true,
                'status' => $verification->getStatus(),
                'verified_at' => $verification->getVerifiedAt()?->toIso8601String(),
                'transaction_status' => $transaction?->status,
                'inventory_sold' => $inventorySold,
                'credits_added' => $creditsAdded,
            ]);

        } catch (\Exception $e) {
            Log::error('Payment verification failed', ['error' => $e->getMessage()]);

            return $this->error('Payment verification failed: '.$e->getMessage(), 500);
        }
    }

    protected function verifyInternalPayment(Request $request, $user, $gateway): JsonResponse
    {
        $transactionId = $request->transaction_id;
        if (! $transactionId) {
            return $this->error('Transaction ID is required for wallet verification', 400);
        }

        $transaction = Transaction::find($transactionId);
        if (! $transaction) {
            return $this->error('Transaction not found', 404);
        }

        if (! $this->userOwnsTransaction($user, $transaction)) {
            return $this->error('Unauthorized access to transaction', 403);
        }

        try {
            DB::beginTransaction();

            $metadata = $transaction->metadata ?? [];
            $inventorySold = 0;
            $alreadyCompleted = $transaction->status === 'completed';

            if (! $alreadyCompleted) {
                $transaction->update(['status' => 'completed', 'completed_at' => now()]);
            }

            $paymentRecord = PaymentTransaction::firstOrCreate(
                ['transaction_id' => $transactionId, 'gateway_name' => 'internal'],
                [
                    'gateway_id' => $gateway->id,
                    'gateway_transaction_id' => 'WALLET_'.$transactionId.'_'.time(),
                    'amount' => $transaction->total,
                    'currency' => $transaction->currency,
                    'status' => 'completed',
                    'payment_method' => 'wallet',
                    'payer_info' => [
                        'owner_type' => get_class($user),
                        'owner_id' => $user->id,
                        'email' => $user->email,
                    ],
                    'verified_at' => now(),
                ]
            );

            if (! $paymentRecord->wasRecentlyCreated) {
                $paymentRecord->update(['status' => 'completed', 'verified_at' => now()]);
            }

            // Always process inventory for plan purchases (even if transaction was already completed)
            if (($metadata['purchase_type'] ?? null) === 'plan_purchase') {
                $inventorySold = $this->sellReservedInventory($metadata, $user->id);
            }

            DB::commit();

            return $this->success($alreadyCompleted ? 'Payment already completed' : 'Wallet payment verified successfully', [
                'is_verified' => true,
                'status' => 'completed',
                'verified_at' => $paymentRecord->verified_at?->toIso8601String() ?? now()->toIso8601String(),
                'payment_reference' => $paymentRecord->gateway_transaction_id,
                'inventory_sold' => $inventorySold,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Internal payment verification failed', ['error' => $e->getMessage()]);

            return $this->error('Wallet payment verification failed: '.$e->getMessage(), 500);
        }
    }

    protected function sellReservedInventory(array $metadata, int $userId): int
    {
        if (empty($metadata['reserved_inventory_ids'])) {
            return 0;
        }

        $items = PlanInventory::whereIn('id', $metadata['reserved_inventory_ids'])
            ->where('status', PlanInventory::STATUS_RESERVED)
            ->get();

        foreach ($items as $item) {
            $item->markAsSold($userId);
        }

        if ($items->isNotEmpty() && $items->first()->plan) {
            $items->first()->plan->updateInventoryCounts();
        }

        return $items->count();
    }

    protected function addCreditsToWallet($transaction, $user, $gateway, string $paymentReference): ?float
    {
        $metadata = $transaction->metadata ?? [];

        if (isset($metadata['credits_added'])) {
            return null; // Already added
        }

        $credits = (float) $transaction->total;

        $this->walletService->addFunds(
            $user,
            $credits,
            "Credits purchased via {$gateway->display_name} - \${$credits} (Transaction #{$transaction->id})",
            [
                'type' => 'credit_purchase',
                'transaction_id' => $transaction->id,
                'payment_reference' => $paymentReference,
                'gateway' => $gateway->name,
            ]
        );

        $transaction->update([
            'metadata' => array_merge($metadata, [
                'credits_added' => $credits,
                'credits_added_at' => now()->toIso8601String(),
            ]),
        ]);

        return $credits;
    }

    public function handleWebhook(Request $request, string $gateway): JsonResponse
    {
        try {
            $result = $this->paymentService->processWebhook($gateway, $request->all());

            return response()->json([
                'success' => $result->shouldProcess(),
                'message' => $result->shouldProcess() ? 'Webhook processed' : 'Webhook ignored',
            ]);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', ['gateway' => $gateway, 'error' => $e->getMessage()]);

            return response()->json(['success' => false, 'message' => 'Webhook processing failed'], 400);
        }
    }

    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 20);

        $query = PaymentTransaction::with(['gateway', 'transaction'])
            ->whereHas('transaction', fn ($q) => $q->where('transactionable_id', $user->id)->where('transactionable_type', get_class($user)));

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

        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $transactions->getCollection()->transform(fn ($t) => [
            'id' => $t->id,
            'transaction_id' => $t->transaction_id,
            'gateway' => $t->gateway_name,
            'amount' => $t->amount,
            'currency' => $t->currency,
            'status' => $t->status,
            'payment_method' => $t->payment_method,
            'description' => $t->transaction?->description,
            'created_at' => $t->created_at,
            'verified_at' => $t->verified_at,
        ]);

        return $this->success('', [
            'items' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    public function transactionDetails(string $id): JsonResponse
    {
        $user = request()->user();

        $transaction = PaymentTransaction::with(['gateway', 'transaction'])
            ->where('id', $id)
            ->whereHas('transaction', fn ($q) => $q->where('transactionable_id', $user->id)->where('transactionable_type', get_class($user)))
            ->firstOrFail();

        return $this->success('', [
            'id' => $transaction->id,
            'transaction_id' => $transaction->transaction_id,
            'gateway_name' => $transaction->gateway_name,
            'gateway_transaction_id' => $transaction->gateway_transaction_id,
            'amount' => $transaction->amount,
            'currency' => $transaction->currency,
            'status' => $transaction->status,
            'payment_method' => $transaction->payment_method,
            'created_at' => $transaction->created_at,
            'verified_at' => $transaction->verified_at,
        ]);
    }

    public function callback(Request $request): JsonResponse
    {
        return $this->success('Payment callback received', [
            'payment_id' => $request->get('paymentId'),
            'gateway' => $request->get('gateway'),
            'status' => 'callback_received',
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $transactionId = $request->get('transactionId');

        if ($transactionId) {
            $transaction = Transaction::find($transactionId);
            if ($transaction && ! empty($transaction->metadata['reserved_inventory_ids'])) {
                $items = PlanInventory::whereIn('id', $transaction->metadata['reserved_inventory_ids'])
                    ->where('status', PlanInventory::STATUS_RESERVED)
                    ->get();
                $this->inventoryService->releaseInventory($items->toArray());
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Payment cancelled by user',
        ]);
    }

    public function paymentSuccess(Request $request): JsonResponse
    {
        $paymentId = $request->get('paymentId');

        $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $paymentId)
            ->orWhere('id', $paymentId)
            ->first();

        if ($paymentRecord) {
            $paymentRecord->markAsVerified(['callback_verified' => true]);
            $paymentRecord->transaction?->complete();
        }

        return $this->success('Payment completed successfully', [
            'payment_id' => $paymentId,
            'status' => 'completed',
        ]);
    }

    public function refund(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_reference' => 'required|string',
            'gateway' => 'required|string',
            'amount' => 'numeric|min:0.01',
            'reason' => 'string|in:duplicate,fraudulent,requested_by_customer',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        $user = $request->user();

        try {
            $paymentRecord = PaymentTransaction::where('gateway_transaction_id', $request->payment_reference)
                ->orWhere('id', $request->payment_reference)
                ->first();

            if (! $paymentRecord) {
                return $this->error('Payment not found', 404);
            }

            if ($paymentRecord->transaction && $paymentRecord->transaction->user_id !== $user->id) {
                return $this->error('Unauthorized access to payment', 403);
            }

            $refundResponse = $this->paymentService->setGateway($request->gateway)->refund($request->payment_reference, $request->amount);

            if (! $refundResponse->isSuccessful()) {
                return $this->error($refundResponse->getErrorMessage() ?? 'Refund failed', 400);
            }

            $refundAmount = $request->amount ?? $paymentRecord->amount;

            $paymentRecord->update([
                'status' => 'refunded',
                'metadata' => array_merge($paymentRecord->metadata ?? [], [
                    'refunded_at' => now()->toIso8601String(),
                    'refund_amount' => $refundAmount,
                    'refund_reference' => $refundResponse->getGatewayReference(),
                ]),
            ]);

            // Refund to wallet for internal gateway
            if ($paymentRecord->gateway_name === 'internal' && $paymentRecord->payer_info) {
                $payerInfo = $paymentRecord->payer_info;
                if (isset($payerInfo['owner_type'], $payerInfo['owner_id'])) {
                    $owner = $payerInfo['owner_type']::find($payerInfo['owner_id']);
                    if ($owner) {
                        $this->walletService->addFunds($owner, $refundAmount, "Refund for payment #{$paymentRecord->id}");
                    }
                }
            }

            return $this->success('Refund processed successfully', [
                'refund_id' => $refundResponse->getGatewayReference(),
                'refund_amount' => $refundAmount,
            ]);

        } catch (\Exception $e) {
            Log::error('Refund failed', ['error' => $e->getMessage()]);

            return $this->error('Refund failed: '.$e->getMessage(), 500);
        }
    }

    public function getPaymentMethods(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->stripe_customer_id) {
            return $this->success('', []);
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            $paymentMethods = $stripe->paymentMethods->all([
                'customer' => $user->stripe_customer_id,
                'type' => 'card',
            ]);

            $methods = collect($paymentMethods->data)->map(fn ($pm) => [
                'id' => $pm->id,
                'brand' => $pm->card->brand,
                'last4' => $pm->card->last4,
                'exp_month' => $pm->card->exp_month,
                'exp_year' => $pm->card->exp_year,
                'is_default' => $pm->id === $user->default_payment_method_id,
            ]);

            return $this->success('', $methods->values()->toArray());

        } catch (\Exception $e) {
            return $this->success('', []);
        }
    }

    public function addPaymentMethod(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_method_id' => 'required|string',
            'set_as_default' => 'boolean',
            'gateway' => 'required|string|in:stripe',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator);
        }

        $user = $request->user();

        try {
            $stripeSecret = config('services.stripe.secret');
            if (! $stripeSecret) {
                return $this->error('Payment gateway not configured', 500);
            }

            $stripe = new StripeClient($stripeSecret);

            if (! $user->stripe_customer_id) {
                $customer = $stripe->customers->create([
                    'email' => $user->email,
                    'name' => $user->name,
                    'metadata' => ['user_id' => $user->id],
                ]);
                $user->update(['stripe_customer_id' => $customer->id]);
                $user->refresh();
            }

            $stripe->paymentMethods->attach($request->payment_method_id, [
                'customer' => $user->stripe_customer_id,
            ]);

            $shouldSetAsDefault = $request->get('set_as_default', false) || ! $user->default_payment_method_id;

            if ($shouldSetAsDefault) {
                $stripe->customers->update($user->stripe_customer_id, [
                    'invoice_settings' => ['default_payment_method' => $request->payment_method_id],
                ]);
                $user->update(['default_payment_method_id' => $request->payment_method_id]);
            }

            $paymentMethod = $stripe->paymentMethods->retrieve($request->payment_method_id);

            return $this->success('Payment method added successfully', [
                'payment_method_id' => $request->payment_method_id,
                'brand' => $paymentMethod->card->brand,
                'last4' => $paymentMethod->card->last4,
                'exp_month' => $paymentMethod->card->exp_month,
                'exp_year' => $paymentMethod->card->exp_year,
                'is_default' => $shouldSetAsDefault,
            ]);

        } catch (\Stripe\Exception\CardException $e) {
            return $this->error($e->getError()->message, 400);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            return $this->error('Invalid payment method', 400);
        } catch (\Exception $e) {
            Log::error('Failed to add payment method', ['error' => $e->getMessage()]);

            return $this->error('Failed to add payment method', 500);
        }
    }

    public function removePaymentMethod(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            $paymentMethod = $stripe->paymentMethods->retrieve($id);

            if ($paymentMethod->customer !== $user->stripe_customer_id) {
                return $this->error('Unauthorized', 403);
            }

            $stripe->paymentMethods->detach($id);

            if ($user->default_payment_method_id === $id) {
                $user->update(['default_payment_method_id' => null]);
            }

            return $this->success('Payment method removed successfully');

        } catch (\Exception $e) {
            Log::error('Failed to remove payment method', ['error' => $e->getMessage()]);

            return $this->error('Failed to remove payment method', 500);
        }
    }

    public function setDefaultPaymentMethod(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            $paymentMethod = $stripe->paymentMethods->retrieve($id);

            if ($paymentMethod->customer !== $user->stripe_customer_id) {
                return $this->error('Unauthorized', 403);
            }

            $stripe->customers->update($user->stripe_customer_id, [
                'invoice_settings' => ['default_payment_method' => $id],
            ]);

            $user->update(['default_payment_method_id' => $id]);

            return $this->success('Default payment method updated');

        } catch (\Exception $e) {
            Log::error('Failed to set default payment method', ['error' => $e->getMessage()]);

            return $this->error('Failed to update default payment method', 500);
        }
    }

    public function getGatewayConfig(): JsonResponse
    {
        $gateway = PaymentGateway::where('name', 'stripe')->where('is_active', true)->first();

        if (! $gateway) {
            return $this->error('Stripe gateway not configured', 404);
        }

        return $this->success('', [
            'public_key' => $gateway->credentials['public_key'] ?? config('services.stripe.key'),
            'gateway_name' => $gateway->name,
        ]);
    }

    public function checkPlanInventory($planId): JsonResponse
    {
        $plan = Plan::withCount([
            'inventories as available_stock' => fn ($q) => $q->where('status', PlanInventory::STATUS_AVAILABLE),
            'inventories as reserved_stock' => fn ($q) => $q->where('status', PlanInventory::STATUS_RESERVED),
            'inventories as sold_stock' => fn ($q) => $q->where('status', PlanInventory::STATUS_SOLD),
        ])->findOrFail($planId);

        return $this->success('', [
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
            'inventory_enabled' => $plan->inventory_enabled,
            'available_stock' => $plan->available_stock,
            'reserved_stock' => $plan->reserved_stock,
            'sold_stock' => $plan->sold_stock,
        ]);
    }

    // Helper methods

    protected function normalizeMetadata($metadata): array
    {
        if (is_string($metadata)) {
            return json_decode($metadata, true) ?: [];
        }

        return is_array($metadata) ? $metadata : [];
    }

    protected function userOwnsTransaction($user, $transaction): bool
    {
        return $transaction->transactionable &&
            $transaction->transactionable_type === get_class($user) &&
            $transaction->transactionable_id === $user->id;
    }

    protected function getVerificationErrorMessage(string $status): string
    {
        return match ($status) {
            'requires_payment_method' => 'Payment method is required',
            'requires_confirmation' => 'Payment requires confirmation',
            'requires_action' => 'Payment requires additional action',
            'processing' => 'Payment is processing',
            'canceled' => 'Payment was cancelled',
            'failed' => 'Payment failed',
            default => 'Payment not verified',
        };
    }

    protected function success(string $message, $data = null, int $status = 200): JsonResponse
    {
        $response = ['success' => true];
        if ($message) {
            $response['message'] = $message;
        }
        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $status);
    }

    protected function error(string $message, int $status = 400, $data = null): JsonResponse
    {
        $response = ['success' => false, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $status);
    }

    protected function validationError($validator): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422);
    }
}
