<?php

namespace App\Services\Delivery;

use App\Models\DeliveryMethod;
use App\Models\PlanInventory;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookDeliveryDriver implements DeliveryDriverInterface
{
    protected ?DeliveryMethod $method = null;

    public function setMethod(DeliveryMethod $method): self
    {
        $this->method = $method;

        return $this;
    }

    public function deliver(PlanInventory $inventory, User $user): DeliveryResult
    {
        if (! $this->method) {
            return DeliveryResult::failure('Delivery method not configured');
        }

        $credentials = $this->method->credentials;
        $url = $credentials['url'] ?? null;

        if (! $url) {
            return DeliveryResult::failure('Webhook URL not configured');
        }

        try {
            $payload = $this->buildPayload($inventory, $user);
            $headers = $this->buildHeaders($payload, $credentials);

            $timeout = $this->method->getSetting('timeout', 30);

            $response = Http::timeout($timeout)
                ->withHeaders($headers)
                ->post($url, $payload);

            if ($response->successful()) {
                Log::info('Coupon delivered via webhook', [
                    'inventory_id' => $inventory->id,
                    'user_id' => $user->id,
                    'webhook_url' => $url,
                    'status_code' => $response->status(),
                ]);

                return DeliveryResult::success('Webhook delivery successful', [
                    'status_code' => $response->status(),
                    'response_body' => $response->json() ?? $response->body(),
                ]);
            }

            throw new \Exception("Webhook returned status {$response->status()}: {$response->body()}");
        } catch (\Exception $e) {
            Log::error('Webhook delivery failed', [
                'inventory_id' => $inventory->id,
                'user_id' => $user->id,
                'webhook_url' => $url,
                'error' => $e->getMessage(),
            ]);

            return DeliveryResult::failure('Webhook delivery failed: '.$e->getMessage());
        }
    }

    public function supports(string $type): bool
    {
        return $type === DeliveryMethod::TYPE_WEBHOOK;
    }

    public function validateCredentials(array $credentials): bool
    {
        return ! empty($credentials['url']) && filter_var($credentials['url'], FILTER_VALIDATE_URL);
    }

    protected function buildPayload(PlanInventory $inventory, User $user): array
    {
        $plan = $inventory->plan;

        return [
            'event' => 'coupon.delivered',
            'timestamp' => now()->toIso8601String(),
            'inventory' => [
                'id' => $inventory->id,
                'code' => $inventory->code,
                'plan_id' => $inventory->plan_id,
                'plan_name' => $plan->name,
                'expires_at' => $inventory->expires_at?->toIso8601String(),
            ],
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
            'coupon_url' => $inventory->coupon_view_url,
        ];
    }

    protected function buildHeaders(array $payload, array $credentials): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'User-Agent' => 'CouponDeliveryService/1.0',
        ];

        // Add custom headers if configured
        if (! empty($credentials['headers']) && is_array($credentials['headers'])) {
            $headers = array_merge($headers, $credentials['headers']);
        }

        // Add HMAC signature if secret is configured
        if (! empty($credentials['secret'])) {
            $signature = $this->generateSignature($payload, $credentials['secret']);
            $headers['X-Signature'] = $signature;
            $headers['X-Signature-Algorithm'] = 'sha256';
        }

        return $headers;
    }

    protected function generateSignature(array $payload, string $secret): string
    {
        $payloadJson = json_encode($payload);

        return hash_hmac('sha256', $payloadJson, $secret);
    }
}
