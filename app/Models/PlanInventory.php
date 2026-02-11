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

    protected $fillable = [
        'plan_id',
        'user_id',
        'code',
        'status',
        'purchased_at',
        'sold_at',
        'expires_at',
        'meta_data',
    ];

    protected $casts = [
        'purchased_at' => 'datetime',
        'sold_at' => 'datetime',
        'expires_at' => 'datetime',
        'meta_data' => 'array',
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


}
