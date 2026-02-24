<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\URL;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class PlanInventory extends Model implements HasMedia
{
    use HasFactory, SoftDeletes, InteractsWithMedia;

    const STATUS_AVAILABLE = 1;
    const STATUS_RESERVED = 2;
    const STATUS_SOLD = 3;
    const STATUS_EXPIRED = 4;

    // Delivery status constants
    const DELIVERY_PENDING = 'pending';
    const DELIVERY_QUEUED = 'queued';
    const DELIVERY_SENDING = 'sending';
    const DELIVERY_SENT = 'sent';
    const DELIVERY_FAILED = 'failed';
    const DELIVERY_DELIVERED = 'delivered';

    protected $fillable = [
        'plan_id',
        'user_id',
        'code',
        'status',
        'delivery_status',
        'purchased_at',
        'sold_at',
        'delivered_at',
        'delivery_attempts',
        'last_delivery_attempt_at',
        'delivery_metadata',
        'expires_at',
        'meta_data',
    ];

    protected $casts = [
        'purchased_at' => 'datetime',
        'sold_at' => 'datetime',
        'delivered_at' => 'datetime',
        'last_delivery_attempt_at' => 'datetime',
        'expires_at' => 'datetime',
        'meta_data' => 'array',
        'delivery_metadata' => 'array',
        'delivery_attempts' => 'integer',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($inventory) {
            if (empty($inventory->status)) {
                $inventory->status = self::STATUS_AVAILABLE;
            }
        });
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', self::STATUS_AVAILABLE);
    }

    public function scopeReserved($query)
    {
        return $query->where('status', self::STATUS_RESERVED);
    }

    public function scopeSold($query)
    {
        return $query->where('status', self::STATUS_SOLD);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByPlan($query, $planId)
    {
        return $query->where('plan_id', $planId);
    }

    /**
     * Mark as sold
     */
    public function markAsSold(int $userId): self
    {
        $this->update([
            'status' => self::STATUS_SOLD,
            'user_id' => $userId,
            'sold_at' => now(),
            'meta_data' => array_merge($this->meta_data ?? [], [
                'sold_at' => now()->toIso8601String(),
            ]),
        ]);

        return $this;
    }

    /**
     * Mark as reserved
     */
    public function markAsReserved(?array $metadata = []): self
    {
        $this->update([
            'status' => self::STATUS_RESERVED,
            'meta_data' => array_merge($this->meta_data ?? [], [
                'reserved_at' => now()->toIso8601String(),
                'reservation_metadata' => $metadata,
            ]),
        ]);

        return $this;
    }

    /**
     * Mark as available
     */
    public function markAsAvailable(): self
    {
        $this->update([
            'status' => self::STATUS_AVAILABLE,
            'user_id' => null,
            'sold_at' => null,
            'meta_data' => array_merge($this->meta_data ?? [], [
                'released_at' => now()->toIso8601String(),
            ]),
        ]);

        return $this;
    }

    /**
     * Check if item is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Register media collections
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('coupon')
            ->useDisk('private')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']);
    }

    /**
     * Get coupon URL
     */
    public function getCouponUrlAttribute(): ?string
    {
        $media = $this->getFirstMedia('coupon');
        return $media ? $media->getUrl() : null;
    }

    public function getCouponViewUrlAttribute(): ?string
    {
        return URL::temporarySignedRoute(
            'coupons.view',
            now()->addMinutes(10),
            ['inventory' => $this->id]
        );
    }

    /**
     * Get all available delivery statuses
     */
    public static function getDeliveryStatuses(): array
    {
        return [
            self::DELIVERY_PENDING => 'Pending',
            self::DELIVERY_QUEUED => 'Queued',
            self::DELIVERY_SENDING => 'Sending',
            self::DELIVERY_SENT => 'Sent',
            self::DELIVERY_FAILED => 'Failed',
            self::DELIVERY_DELIVERED => 'Delivered',
        ];
    }

    /**
     * Mark delivery as queued
     */
    public function markDeliveryQueued(): self
    {
        $this->update([
            'delivery_status' => self::DELIVERY_QUEUED,
            'delivery_metadata' => array_merge($this->delivery_metadata ?? [], [
                'queued_at' => now()->toIso8601String(),
            ]),
        ]);

        return $this;
    }

    /**
     * Mark delivery as sending
     */
    public function markDeliverySending(): self
    {
        $this->update([
            'delivery_status' => self::DELIVERY_SENDING,
            'delivery_attempts' => $this->delivery_attempts + 1,
            'last_delivery_attempt_at' => now(),
        ]);

        return $this;
    }

    /**
     * Mark delivery as sent
     */
    public function markDeliverySent(array $metadata = []): self
    {
        $this->update([
            'delivery_status' => self::DELIVERY_SENT,
            'delivered_at' => now(),
            'delivery_metadata' => array_merge($this->delivery_metadata ?? [], $metadata, [
                'sent_at' => now()->toIso8601String(),
            ]),
        ]);

        return $this;
    }

    /**
     * Mark delivery as failed
     */
    public function markDeliveryFailed(string $reason = null): self
    {
        $this->update([
            'delivery_status' => self::DELIVERY_FAILED,
            'delivery_metadata' => array_merge($this->delivery_metadata ?? [], [
                'failed_at' => now()->toIso8601String(),
                'failure_reason' => $reason,
            ]),
        ]);

        return $this;
    }

    /**
     * Mark delivery as delivered (confirmed receipt)
     */
    public function markDeliveryDelivered(array $metadata = []): self
    {
        $this->update([
            'delivery_status' => self::DELIVERY_DELIVERED,
            'delivery_metadata' => array_merge($this->delivery_metadata ?? [], $metadata, [
                'confirmed_at' => now()->toIso8601String(),
            ]),
        ]);

        return $this;
    }

    /**
     * Check if delivery can be retried
     */
    public function canRetryDelivery(): bool
    {
        if (!$this->plan || !$this->plan->deliveryMethod) {
            return false;
        }

        $maxAttempts = $this->plan->deliveryMethod->retry_attempts;
        return $this->delivery_status === self::DELIVERY_FAILED
            && $this->delivery_attempts < $maxAttempts;
    }

    /**
     * Check if item needs delivery
     */
    public function needsDelivery(): bool
    {
        return $this->status === self::STATUS_SOLD
            && in_array($this->delivery_status, [self::DELIVERY_PENDING, self::DELIVERY_QUEUED]);
    }

    /**
     * Scope for items needing delivery
     */
    public function scopeNeedsDelivery($query)
    {
        return $query->where('status', self::STATUS_SOLD)
            ->whereIn('delivery_status', [self::DELIVERY_PENDING, self::DELIVERY_QUEUED]);
    }

    /**
     * Scope for failed deliveries that can be retried
     */
    public function scopeRetryableDeliveries($query)
    {
        return $query->where('status', self::STATUS_SOLD)
            ->where('delivery_status', self::DELIVERY_FAILED)
            ->whereHas('plan.deliveryMethod', function ($q) {
                $q->whereColumn('plan_inventories.delivery_attempts', '<', 'delivery_methods.retry_attempts');
            });
    }
}

