<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Support\Facades\DB;

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
        // Add these new fields
        'inventory_enabled',
        'low_stock_threshold',
    ];

    protected $casts = [
        'meta_data' => 'array',
        'base_price' => 'decimal:2',
        'actual_price' => 'decimal:2',
        'is_active' => 'boolean',
        'inventory_enabled' => 'boolean',
        'low_stock_threshold' => 'integer',
    ];

    protected $attributes = [
        'inventory_enabled' => false,
        'low_stock_threshold' => 5,
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
        return $this->hasMany(PlanInventory::class)->where('status', PlanInventory::STATUS_AVAILABLE);
    }

    public function reservedInventories()
    {
        return $this->hasMany(PlanInventory::class)->where('status', 'reserved');
    }

    public function soldInventories()
    {
        return $this->hasMany(PlanInventory::class)->where('status', 'sold');
    }

    /**
     * Get available stock count
     */
    public function getAvailableStockAttribute()
    {
        return $this->inventories()->where('status', PlanInventory::STATUS_AVAILABLE)->count();
    }

    /**
     * Get reserved stock count
     */
    public function getReservedStockAttribute()
    {
        return $this->inventories()->where('status', 'reserved')->count();
    }

    /**
     * Get sold stock count
     */
    public function getSoldStockAttribute()
    {
        return $this->inventories()->where('status', 'sold')->count();
    }

    /**
     * Get total stock count
     */
    public function getTotalStockAttribute()
    {
        return $this->inventories()->count();
    }

    /**
     * Check if plan has available inventory
     */
    public function hasAvailableInventory(int $quantity = 1): bool
    {
        if (!$this->inventory_enabled) {
            return true; // Unlimited inventory
        }

        return $this->availableStock >= $quantity;
    }

    /**
     * Check if plan is in stock
     */
    public function getInStockAttribute(): bool
    {
        if (!$this->inventory_enabled) {
            return true;
        }

        return $this->availableStock > 0;
    }

    /**
     * Check if stock is low
     */
    public function getIsLowStockAttribute(): bool
    {
        if (!$this->inventory_enabled || $this->availableStock <= 0) {
            return false;
        }

        return $this->availableStock <= $this->low_stock_threshold;
    }

    /**
     * Check if out of stock
     */
    public function getIsOutOfStockAttribute(): bool
    {
        if (!$this->inventory_enabled) {
            return false;
        }

        return $this->availableStock <= 0;
    }

    /**
     * Reserve inventory items for purchase
     */
    public function reserveInventory(int $quantity = 1, ?array $metadata = []): array
    {
        if (!$this->hasAvailableInventory($quantity)) {
            throw new \Exception("Insufficient inventory available for plan: {$this->name}");
        }

        $reservedItems = [];

        DB::transaction(function () use ($quantity, $metadata, &$reservedItems) {
            // Get available items and lock them for update
            $items = $this->inventories()
                ->where('status', PlanInventory::STATUS_AVAILABLE)
                ->lockForUpdate()
                ->limit($quantity)
                ->get();

            return response()->json($items);

            foreach ($items as $item) {
                $item->update([
                    'status' => 'reserved',
                    'meta_data' => array_merge($item->meta_data ?? [], [
                        'reserved_at' => now()->toIso8601String(),
                        'reservation_metadata' => $metadata,
                    ]),
                ]);

                $reservedItems[] = $item;
            }
        });

        return $reservedItems;
    }

    /**
     * Release reserved inventory
     */
    public function releaseInventory(array $itemIds): void
    {
        DB::transaction(function () use ($itemIds) {
            $this->inventories()
                ->whereIn('id', $itemIds)
                ->where('status', 'reserved')
                ->update([
                    'status' => PlanInventory::STATUS_AVAILABLE,
                    'user_id' => null,
                    'sold_at' => null,
                    'meta_data' => DB::raw("JSON_SET(COALESCE(meta_data, '{}'), '$.released_at', '" . now()->toIso8601String() . "')")
                ]);
        });
    }

    /**
     * Mark inventory as sold
     */
    public function sellInventory(array $itemIds, int $userId): void
    {
        DB::transaction(function () use ($itemIds, $userId) {
            $now = now();

            $this->inventories()
                ->whereIn('id', $itemIds)
                ->where('status', 'reserved')
                ->update([
                    'status' => 'sold',
                    'user_id' => $userId,
                    'sold_at' => $now,
                    'meta_data' => DB::raw("JSON_SET(COALESCE(meta_data, '{}'), '$.sold_at', '" . $now->toIso8601String() . "')")
                ]);
        });
    }

    /**
     * Scope for in-stock plans
     */
    public function scopeInStock($query)
    {
        return $query->where(function($q) {
            $q->where('inventory_enabled', false)
              ->orWhereHas('inventories', function($q2) {
                  $q2->where('status', PlanInventory::STATUS_AVAILABLE);
              });
        });
    }

    /**
     * Scope for low stock plans
     */
    public function scopeLowStock($query)
    {
        return $query->where('inventory_enabled', true)
            ->whereHas('inventories', function($q) {
                $q->selectRaw('count(*) as stock')
                  ->where('status', PlanInventory::STATUS_AVAILABLE)
                  ->havingRaw('stock <= plans.low_stock_threshold')
                  ->havingRaw('stock > 0');
            });
    }

    /**
     * Scope for out of stock plans
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('inventory_enabled', true)
            ->whereDoesntHave('inventories', function($q) {
                $q->where('status', PlanInventory::STATUS_AVAILABLE);
            });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->useFallbackUrl('/images/plan-placeholder.png');

        $this->addMediaCollection('documents')
            ->acceptsMimeTypes(['application/pdf']);
    }

    /**
 * Update inventory counts on plan
 */
public function updateInventoryCounts(): void
{
    if (!$this->inventory_enabled) {
        return;
    }

    $this->update([
        'total_inventory' => $this->inventories()->count(),
        'available_inventory' => $this->inventories()->where('status', PlanInventory::STATUS_AVAILABLE)->count(),
        'reserved_inventory' => $this->inventories()->where('status', PlanInventory::STATUS_RESERVED)->count(),
        'sold_inventory' => $this->inventories()->where('status', PlanInventory::STATUS_SOLD)->count(),
    ]);
}
}
