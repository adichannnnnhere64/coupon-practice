<?php

namespace App\Services\Delivery;

use App\Models\DeliveryMethod;
use App\Models\PlanInventory;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsDeliveryDriver implements DeliveryDriverInterface
{
    protected ?DeliveryMethod $method = null;

    const PROVIDER_TWILIO = 'twilio';
    const PROVIDER_NEXMO = 'nexmo';

    public function setMethod(DeliveryMethod $method): self
    {
        $this->method = $method;
        return $this;
    }

    public function deliver(PlanInventory $inventory, User $user): DeliveryResult
    {
        if (!$this->method) {
            return DeliveryResult::failure('Delivery method not configured');
        }

        $credentials = $this->method->credentials;
        $provider = $credentials['provider'] ?? self::PROVIDER_TWILIO;

        // Get user's phone number from profile or metadata
        $phoneNumber = $user->phone ?? $user->meta_data['phone'] ?? null;
        if (!$phoneNumber) {
            return DeliveryResult::failure('User does not have a phone number configured');
        }

        $message = $this->buildMessage($inventory);

        try {
            $result = match ($provider) {
                self::PROVIDER_TWILIO => $this->sendViaTwilio($phoneNumber, $message, $credentials),
                self::PROVIDER_NEXMO => $this->sendViaNexmo($phoneNumber, $message, $credentials),
                default => throw new \Exception("Unsupported SMS provider: {$provider}"),
            };

            Log::info('Coupon delivered via SMS', [
                'inventory_id' => $inventory->id,
                'user_id' => $user->id,
                'phone' => $phoneNumber,
                'provider' => $provider,
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error('SMS delivery failed', [
                'inventory_id' => $inventory->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return DeliveryResult::failure('SMS delivery failed: ' . $e->getMessage());
        }
    }

    public function supports(string $type): bool
    {
        return $type === DeliveryMethod::TYPE_SMS;
    }

    public function validateCredentials(array $credentials): bool
    {
        $provider = $credentials['provider'] ?? self::PROVIDER_TWILIO;

        return match ($provider) {
            self::PROVIDER_TWILIO => !empty($credentials['account_sid'])
                && !empty($credentials['auth_token'])
                && !empty($credentials['from_number']),
            self::PROVIDER_NEXMO => !empty($credentials['api_key'])
                && !empty($credentials['api_secret'])
                && !empty($credentials['from_number']),
            default => false,
        };
    }

    protected function buildMessage(PlanInventory $inventory): string
    {
        $plan = $inventory->plan;
        $template = $this->method->getSetting('message_template',
            "Your coupon code for {plan_name}: {code}. View details at: {url}"
        );

        return str_replace(
            ['{plan_name}', '{code}', '{url}'],
            [$plan->name, $inventory->code, $inventory->coupon_view_url],
            $template
        );
    }

    protected function sendViaTwilio(string $to, string $message, array $credentials): DeliveryResult
    {
        $accountSid = $credentials['account_sid'];
        $authToken = $credentials['auth_token'];
        $fromNumber = $credentials['from_number'];

        $response = Http::withBasicAuth($accountSid, $authToken)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'From' => $fromNumber,
                'To' => $to,
                'Body' => $message,
            ]);

        if ($response->successful()) {
            $data = $response->json();
            return DeliveryResult::success('SMS sent via Twilio', [
                'provider' => 'twilio',
                'message_sid' => $data['sid'] ?? null,
            ])->withExternalReference($data['sid'] ?? '');
        }

        throw new \Exception('Twilio API error: ' . $response->body());
    }

    protected function sendViaNexmo(string $to, string $message, array $credentials): DeliveryResult
    {
        $response = Http::post('https://rest.nexmo.com/sms/json', [
            'api_key' => $credentials['api_key'],
            'api_secret' => $credentials['api_secret'],
            'from' => $credentials['from_number'],
            'to' => $to,
            'text' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            if (($data['messages'][0]['status'] ?? '') === '0') {
                return DeliveryResult::success('SMS sent via Nexmo', [
                    'provider' => 'nexmo',
                    'message_id' => $data['messages'][0]['message-id'] ?? null,
                ])->withExternalReference($data['messages'][0]['message-id'] ?? '');
            }
            throw new \Exception('Nexmo error: ' . ($data['messages'][0]['error-text'] ?? 'Unknown error'));
        }

        throw new \Exception('Nexmo API error: ' . $response->body());
    }
}
