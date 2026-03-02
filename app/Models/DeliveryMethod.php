<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryMethod extends Model
{
    use HasFactory, SoftDeletes;

    const TYPE_EMAIL = 'email';

    const TYPE_SMS = 'sms';

    const TYPE_WEBHOOK = 'webhook';

    const TYPE_API = 'api';

    const TYPE_MANUAL = 'manual';

    protected $fillable = [
        'name',
        'display_name',
        'type',
        'credentials',
        'settings',
        'is_active',
        'retry_attempts',
        'retry_delay_seconds',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
        'settings' => 'array',
        'is_active' => 'boolean',
        'retry_attempts' => 'integer',
        'retry_delay_seconds' => 'integer',
    ];

    protected $attributes = [
        'is_active' => true,
        'retry_attempts' => 3,
        'retry_delay_seconds' => 60,
    ];

    protected $hidden = [
        'credentials',
    ];

    /**
     * Get all available delivery types
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_EMAIL => 'Email',
            self::TYPE_SMS => 'SMS',
            self::TYPE_WEBHOOK => 'Webhook',
            self::TYPE_API => 'API',
            self::TYPE_MANUAL => 'Manual',
        ];
    }

    /**
     * Plans using this delivery method (legacy one-to-one)
     */
    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }

    /**
     * Plans using this delivery method (many-to-many)
     */
    public function plansMany()
    {
        return $this->belongsToMany(Plan::class, 'plan_delivery_method')
            ->withPivot('is_default', 'sort_order')
            ->withTimestamps();
    }

    /**
     * Get a specific credential value
     */
    public function getCredential(string $key, mixed $default = null): mixed
    {
        return $this->credentials[$key] ?? $default;
    }

    /**
     * Get a specific setting value
     */
    public function getSetting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $default;
    }

    /**
     * Check if this delivery method is of a specific type
     */
    public function isType(string $type): bool
    {
        return $this->type === $type;
    }

    /**
     * Check if this is an email delivery method
     */
    public function isEmail(): bool
    {
        return $this->isType(self::TYPE_EMAIL);
    }

    /**
     * Check if this is an SMS delivery method
     */
    public function isSms(): bool
    {
        return $this->isType(self::TYPE_SMS);
    }

    /**
     * Check if this is a webhook delivery method
     */
    public function isWebhook(): bool
    {
        return $this->isType(self::TYPE_WEBHOOK);
    }

    /**
     * Scope for active delivery methods
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
