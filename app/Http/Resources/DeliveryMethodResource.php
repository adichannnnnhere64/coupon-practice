<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\DeliveryMethod
 */
class DeliveryMethodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'type' => $this->type,
            'is_active' => $this->is_active,
            'is_default' => $this->whenPivotLoaded('plan_delivery_method', fn () => (bool) $this->pivot->is_default),
            'sort_order' => $this->whenPivotLoaded('plan_delivery_method', fn () => $this->pivot->sort_order),
        ];
    }
}
