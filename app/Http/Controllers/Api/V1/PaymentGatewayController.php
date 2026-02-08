<?php

namespace App\Http\Controllers\Api\V1;

use Adichan\Payment\Models\PaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PaymentGatewayController extends Controller
{
    /**
     * Get all available payment gateways
     */
    public function index(Request $request): JsonResponse
    {
        $gateways = PaymentGateway::where('is_active', true)
            ->orderBy('priority')
            ->get()
            ->map(function ($gateway) {
                return [
                    'id' => $gateway->id,
                    'name' => $gateway->name,
                    'display_name' => $gateway->meta['display_name'] ?? $gateway->name,
                    'driver' => $gateway->driver,
                    'description' => $gateway->meta['description'] ?? null,
                    'icon' => $gateway->meta['icon'] ?? null,
                    'is_external' => $gateway->is_external,
                    'priority' => $gateway->priority,
                    'config' => $this->getSafeConfig($gateway),
                    'meta' => $this->getSafeMeta($gateway),
                    'created_at' => $gateway->created_at,
                    'updated_at' => $gateway->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $gateways,
            'message' => 'Payment gateways retrieved successfully',
        ]);
    }

    /**
     * Get a specific payment gateway by ID or name
     */
    public function show(string $identifier): JsonResponse
    {
        $gateway = PaymentGateway::where('id', $identifier)
            ->orWhere('name', $identifier)
            ->firstOrFail();

        if (!$gateway->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway is not active',
            ], 403);
        }

        $data = [
            'id' => $gateway->id,
            'name' => $gateway->name,
            'display_name' => $gateway->meta['display_name'] ?? $gateway->name,
            'driver' => $gateway->driver,
            'description' => $gateway->meta['description'] ?? null,
            'icon' => $gateway->meta['icon'] ?? null,
            'is_external' => $gateway->is_external,
            'priority' => $gateway->priority,
            'config' => $this->getSafeConfig($gateway),
            'meta' => $this->getSafeMeta($gateway),
            'created_at' => $gateway->created_at,
            'updated_at' => $gateway->updated_at,
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Payment gateway retrieved successfully',
        ]);
    }

    /**
     * Get only active payment gateways for checkout
     */
    public function checkout(Request $request): JsonResponse
    {
        $amount = $request->get('amount');
        $currency = $request->get('currency', 'USD');
        $user = $request->user();

        $gateways = PaymentGateway::where('is_active', true)
            ->orderBy('priority')
            ->get()
            ->map(function ($gateway) use ($amount, $currency, $user) {
                $requiresSetup = false;
                $disabled = false;
                $disabledReason = null;

                // Check if internal wallet gateway should be disabled
                if ($gateway->driver === 'internal' && $user) {
                    $walletService = app(\Adichan\Wallet\Services\WalletService::class);
                    $balance = $walletService->getBalance($user);

                    if ($amount && $balance < $amount) {
                        $disabled = true;
                        $disabledReason = 'Insufficient wallet balance';
                    }
                }

                // Check if Stripe needs configuration
                if ($gateway->driver === 'stripe' && empty($gateway->config['public_key'])) {
                    $requiresSetup = true;
                    $disabled = true;
                    $disabledReason = 'Gateway not configured';
                }

                // Check if PayPal needs configuration
                if ($gateway->driver === 'paypal' && empty($gateway->config['client_id'])) {
                    $requiresSetup = true;
                    $disabled = true;
                    $disabledReason = 'Gateway not configured';
                }

                return [
                    'id' => $gateway->id,
                    'name' => $gateway->name,
                    'display_name' => $gateway->meta['display_name'] ?? $gateway->name,
                    'description' => $gateway->meta['description'] ?? null,
                    'icon' => $gateway->meta['icon'] ?? null,
                    'is_external' => $gateway->is_external,
                    'requires_setup' => $requiresSetup,
                    'disabled' => $disabled,
                    'disabled_reason' => $disabledReason,
                    'meta' => $this->getCheckoutMeta($gateway),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $gateways,
            'message' => 'Checkout gateways retrieved successfully',
        ]);
    }

    /**
     * Toggle gateway status (admin only)
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $gateway = PaymentGateway::findOrFail($id);

        // Add authorization check (you can customize this)
        // if (!auth()->user()->can('manage-payment-gateways')) {
        //     return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        // }

        $gateway->update([
            'is_active' => !$gateway->is_active
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gateway status updated',
            'data' => [
                'is_active' => $gateway->is_active,
                'name' => $gateway->name,
            ],
        ]);
    }

    /**
     * Update gateway priority (admin only)
     */
    public function updatePriority(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'priority' => 'required|integer|min:0',
        ]);

        $gateway = PaymentGateway::findOrFail($id);
        $gateway->update([
            'priority' => $request->priority
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gateway priority updated',
            'data' => [
                'priority' => $gateway->priority,
                'name' => $gateway->name,
            ],
        ]);
    }

    /**
     * Get gateway configuration (admin only)
     */
    public function configuration(string $id): JsonResponse
    {
        $gateway = PaymentGateway::findOrFail($id);

        // Add authorization check for admin
        // if (!auth()->user()->can('manage-payment-gateways')) {
        //     return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        // }

        return response()->json([
            'success' => true,
            'data' => [
                'config' => $gateway->config,
                'meta' => $gateway->meta,
                'raw_config' => $gateway->getRawOriginal('config'),
                'raw_meta' => $gateway->getRawOriginal('meta'),
            ],
            'message' => 'Gateway configuration retrieved',
        ]);
    }

    /**
     * Get safe configuration for public endpoints
     */
    protected function getSafeConfig(PaymentGateway $gateway): array
    {
        $config = $gateway->config ?? [];

        // Remove sensitive data
        unset($config['secret_key']);
        unset($config['client_secret']);
        unset($config['webhook_secret']);
        unset($config['webhook_id']);

        // Only include public configuration
        $safeConfig = [];

        if ($gateway->driver === 'stripe') {
            $safeConfig['public_key'] = $config['public_key'] ?? null;
            $safeConfig['currency'] = 'usd';
            $safeConfig['supported_countries'] = config('payment.supported_countries', ['US', 'GB', 'CA', 'AU']);
        }

        if ($gateway->driver === 'paypal') {
            $safeConfig['mode'] = $config['mode'] ?? 'sandbox';
            $safeConfig['currency'] = $config['currency'] ?? 'USD';
        }

        if ($gateway->driver === 'internal') {
            $safeConfig['currency'] = config('payment.currency', 'USD');
        }

        return $safeConfig;
    }

    /**
     * Get safe meta information
     */
    protected function getSafeMeta(PaymentGateway $gateway): array
    {
        $meta = $gateway->meta ?? [];

        // Add gateway-specific meta
        if ($gateway->driver === 'stripe') {
            $meta['accepted_cards'] = $meta['accepted_cards'] ?? ['visa', 'mastercard', 'amex', 'discover'];
            $meta['payment_methods'] = ['card'];
        }

        if ($gateway->driver === 'paypal') {
            $meta['payment_methods'] = ['paypal'];
        }

        if ($gateway->driver === 'internal') {
            $meta['payment_methods'] = ['wallet'];
        }

        return $meta;
    }

    /**
     * Get checkout-specific meta
     */
    protected function getCheckoutMeta(PaymentGateway $gateway): array
    {
        $meta = $this->getSafeMeta($gateway);

        // Add checkout-specific information
        $meta['min_amount'] = config("payment.gateways.{$gateway->name}.min_amount", 0.50);
        $meta['max_amount'] = config("payment.gateways.{$gateway->name}.max_amount", 10000.00);
        $meta['processing_fee'] = config("payment.gateways.{$gateway->name}.processing_fee", 0);
        $meta['processing_fee_type'] = config("payment.gateways.{$gateway->name}.processing_fee_type", 'percentage');

        return $meta;
    }
}
