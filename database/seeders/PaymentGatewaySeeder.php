<?php

namespace Database\Seeders;

use Adichan\Payment\Models\PaymentGateway;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        // Internal Wallet Gateway
        PaymentGateway::updateOrCreate(
            ['name' => 'internal'],
            [
                'driver' => 'internal',
                'is_active' => true,
                'is_external' => false,
                'priority' => 1,
                'config' => [],
                'meta' => [
                    'display_name' => 'Wallet Balance',
                    'description' => 'Pay using your wallet balance',
                    'icon' => 'wallet',
                ],
            ]
        );

        // Stripe Gateway
        PaymentGateway::updateOrCreate(
            ['name' => 'stripe'],
            [
                'driver' => 'stripe',
                'is_active' => env('STRIPE_ENABLED', false),
                'is_external' => true,
                'priority' => 2,
                'config' => [
                    'secret_key' => env('STRIPE_SECRET_KEY'),
                    'public_key' => env('STRIPE_PUBLIC_KEY'),
                    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
                ],
                'meta' => [
                    'display_name' => 'Credit/Debit Card',
                    'description' => 'Pay securely with your card via Stripe',
                    'icon' => 'card',
                    'accepted_cards' => ['visa', 'mastercard', 'amex', 'discover'],
                ],
            ]
        );

        // PayPal Gateway (optional)
        PaymentGateway::updateOrCreate(
            ['name' => 'paypal'],
            [
                'driver' => 'paypal',
                'is_active' => env('PAYPAL_ENABLED', false),
                'is_external' => true,
                'priority' => 3,
                'config' => [
                    'client_id' => env('PAYPAL_CLIENT_ID'),
                    'client_secret' => env('PAYPAL_CLIENT_SECRET'),
                    'mode' => env('PAYPAL_MODE', 'sandbox'),
                    'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
                ],
                'meta' => [
                    'display_name' => 'PayPal',
                    'description' => 'Pay with your PayPal account',
                    'icon' => 'logo-paypal',
                ],
            ]
        );
    }
}
