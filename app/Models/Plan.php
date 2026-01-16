<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Plan extends Model implements HasMedia
{
    use HasFactory, SoftDeletes, InteractsWithMedia;

    protected $fillable = [
        'plan_type_id',
        'name',
        'base_price',
        'actual_price',
        'description',
        'meta_data',
        'is_active',
    ];

    protected $casts = [
        'meta_data' => 'array',
        'base_price' => 'decimal:2',
        'actual_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function planType()
    {
        return $this->belongsTo(PlanType::class);
    }

    public function attributes()
    {
        return $this->belongsToMany(PlanAttribute::class, 'plan_plan_attribute')
            ->withPivot('value', 'is_unlimited')
            ->withTimestamps();
    }

    public function inventories()
    {
        return $this->hasMany(PlanInventory::class);
    }

    public function availableInventories()
    {
        return $this->hasMany(PlanInventory::class)->where('status', 'available');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->useFallbackUrl('/images/plan-placeholder.png');

        $this->addMediaCollection('documents')
            ->acceptsMimeTypes(['application/pdf']);
    }

    public function getAvailableStockAttribute()
    {
        return $this->inventories()->where('status', 'available')->count();
    }

    public function getTotalStockAttribute()
    {
        return $this->inventories()->count();
    }
}
