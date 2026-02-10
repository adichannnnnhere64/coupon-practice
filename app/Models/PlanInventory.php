<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class PlanInventory extends Model implements HasMedia
{
    use HasFactory, SoftDeletes, InteractsWithMedia;

    protected $fillable = [
        'plan_id',
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

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeSold($query)
    {
        return $query->where('status', 'sold');
    }

    public function scopeReserved($query)
    {
        return $query->where('status', 'reserved');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

      public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('coupon')
            ->useDisk('private')
            ->singleFile(true);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }


}
