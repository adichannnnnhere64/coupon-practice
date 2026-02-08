<?php

namespace Adichan\Payment\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @OA\Schema(
 *     schema="PaymentGateway",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="stripe"),
 *     @OA\Property(property="display_name", type="string", example="Credit Card"),
 *     @OA\Property(property="driver", type="string", example="stripe"),
 *     @OA\Property(property="description", type="string", example="Pay securely with your card"),
 *     @OA\Property(property="icon", type="string", example="card"),
 *     @OA\Property(property="is_external", type="boolean", example=true),
 *     @OA\Property(property="priority", type="integer", example=2),
 *     @OA\Property(
 *         property="config",
 *         type="object",
 *         @OA\Property(property="public_key", type="string", example="pk_test_..."),
 *         @OA\Property(property="currency", type="string", example="usd"),
 *         @OA\Property(
 *             property="supported_countries",
 *             type="array",
 *             @OA\Items(type="string", example="US")
 *         )
 *     ),
 *     @OA\Property(
 *         property="meta",
 *         type="object",
 *         @OA\Property(
 *             property="accepted_cards",
 *             type="array",
 *             @OA\Items(type="string", example="visa")
 *         ),
 *         @OA\Property(
 *             property="payment_methods",
 *             type="array",
 *             @OA\Items(type="string", example="card")
 *         )
 *     ),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class PaymentGatewayResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->meta['display_name'] ?? $this->name,
            'driver' => $this->driver,
            'description' => $this->meta['description'] ?? null,
            'icon' => $this->meta['icon'] ?? null,
            'is_external' => $this->is_external,
            'priority' => $this->priority,
            'config' => $this->getSafeConfig(),
            'meta' => $this->getSafeMeta(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function getSafeConfig(): array
    {
        $config = $this->config ?? [];

        // Remove sensitive data
        unset($config['secret_key']);
        unset($config['client_secret']);
        unset($config['webhook_secret']);
        unset($config['webhook_id']);

        return $config;
    }

    protected function getSafeMeta(): array
    {
        $meta = $this->meta ?? [];

        // Add gateway-specific meta
        if ($this->driver === 'stripe') {
            $meta['accepted_cards'] = $meta['accepted_cards'] ?? ['visa', 'mastercard', 'amex', 'discover'];
            $meta['payment_methods'] = ['card'];
        }

        if ($this->driver === 'paypal') {
            $meta['payment_methods'] = ['paypal'];
        }

        if ($this->driver === 'internal') {
            $meta['payment_methods'] = ['wallet'];
        }

        return $meta;
    }
}
