<?php

namespace App\Mail;

use App\Models\PlanInventory;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

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
        return new Content(
            markdown: 'emails.coupon-delivery',
            with: [
                'inventory' => $this->inventory,
                'user' => $this->user,
                'planName' => $this->inventory->plan?->name ?? 'Plan',
                'code' => $this->inventory->code,
                'viewUrl' => $this->inventory->coupon_view_url, // will be null if no media
                'expiresAt' => $this->inventory->expires_at?->format('F j, Y'),
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
