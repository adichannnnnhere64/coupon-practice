<?php

namespace App\Mail;

use App\Models\PlanInventory;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class CouponDeliveryMail extends Mailable
{
    use Queueable, SerializesModels;

    public PlanInventory $inventory;

    public User $user;

    /**
     * Create a new message instance.
     */
    public function __construct(PlanInventory $inventory, User $user)
    {
        $this->inventory = $inventory;
        $this->user = $user;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $planName = $this->inventory->plan?->name ?? 'Plan';

        return new Envelope(
            subject: "Your {$planName} Coupon",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $printSettings = Cache::get('print_settings', [
            'header_text' => 'CouponPay - Recharge Coupon',
            'footer_text' => 'Thank you for your purchase!',
            'include_qr' => true,
            'include_logo' => true,
            'font_size' => '12px',
        ]);

        $qrUrl = $printSettings['include_qr'] ?? true
            ? route('qr.generate', ['code' => $this->inventory->code])
            : null;

        return new Content(
            markdown: 'emails.coupon-delivery',
            with: [
                'inventory' => $this->inventory,
                'user' => $this->user,
                'planName' => $this->inventory->plan?->name ?? 'Plan',
                'code' => $this->inventory->code,
                'viewUrl' => $this->inventory->coupon_view_url,
                'expiresAt' => $this->inventory->expires_at?->format('F j, Y'),
                'headerText' => $printSettings['header_text'] ?? 'CouponPay - Recharge Coupon',
                'footerText' => $printSettings['footer_text'] ?? 'Thank you for your purchase!',
                'includeQr' => $printSettings['include_qr'] ?? true,
                'includeLogo' => $printSettings['include_logo'] ?? true,
                'fontSize' => $printSettings['font_size'] ?? '12px',
                'qrUrl' => $qrUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
