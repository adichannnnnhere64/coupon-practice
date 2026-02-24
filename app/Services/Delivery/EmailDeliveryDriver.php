<?php

namespace App\Services\Delivery;

use App\Mail\CouponDeliveryMail;
use App\Models\DeliveryMethod;
use App\Models\PlanInventory;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailDeliveryDriver implements DeliveryDriverInterface
{
    protected ?DeliveryMethod $method = null;

    public function setMethod(DeliveryMethod $method): self
    {
        $this->method = $method;
        $this->configureMailer();
        return $this;
    }

    public function deliver(PlanInventory $inventory, User $user): DeliveryResult
    {
        if (!$this->method) {
            return DeliveryResult::failure('Delivery method not configured');
        }

        try {
            $mailable = new CouponDeliveryMail($inventory, $user);

            // Use custom mailer if configured
            $mailerName = $this->getMailerName();
            if ($mailerName) {
                Mail::mailer($mailerName)->to($user->email)->send($mailable);
            } else {
                Mail::to($user->email)->send($mailable);
            }

            Log::info('Coupon delivered via email', [
                'inventory_id' => $inventory->id,
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return DeliveryResult::success('Email sent successfully', [
                'recipient' => $user->email,
                'sent_at' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Email delivery failed', [
                'inventory_id' => $inventory->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return DeliveryResult::failure('Email delivery failed: ' . $e->getMessage());
        }
    }

    public function supports(string $type): bool
    {
        return $type === DeliveryMethod::TYPE_EMAIL;
    }

    public function validateCredentials(array $credentials): bool
    {
        // For email, we need either default config or custom SMTP settings
        if (empty($credentials)) {
            return true; // Use default mail configuration
        }

        // If custom settings provided, validate required fields
        $required = ['host', 'port', 'from_address'];
        foreach ($required as $field) {
            if (empty($credentials[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Configure the mailer with custom SMTP settings if provided
     */
    protected function configureMailer(): void
    {
        if (!$this->method) {
            return;
        }

        $credentials = $this->method->credentials;
        if (empty($credentials) || empty($credentials['host'])) {
            return; // Use default mailer
        }

        $mailerName = $this->getMailerName();

        Config::set("mail.mailers.{$mailerName}", [
            'transport' => 'smtp',
            'host' => $credentials['host'],
            'port' => $credentials['port'] ?? 587,
            'encryption' => $credentials['encryption'] ?? 'tls',
            'username' => $credentials['username'] ?? null,
            'password' => $credentials['password'] ?? null,
            'timeout' => $credentials['timeout'] ?? null,
        ]);

        if (!empty($credentials['from_address'])) {
            Config::set("mail.mailers.{$mailerName}.from", [
                'address' => $credentials['from_address'],
                'name' => $credentials['from_name'] ?? config('app.name'),
            ]);
        }
    }

    /**
     * Get the mailer name for this delivery method
     */
    protected function getMailerName(): ?string
    {
        if (!$this->method || empty($this->method->credentials['host'])) {
            return null;
        }

        return 'delivery_method_' . $this->method->id;
    }
}
