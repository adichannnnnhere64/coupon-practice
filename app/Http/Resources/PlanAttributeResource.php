<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PlanAttribute
 */
class PlanAttributeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'unit' => $this->unit,
            'description' => $this->description,
            'value' => $this->whenPivotLoaded('plan_plan_attribute', function () {
                return $this->pivot->value;
            }),
            'is_unlimited' => $this->whenPivotLoaded('plan_plan_attribute', function () {
                return (bool) $this->pivot->is_unlimited;
            }),
        ];
    }
}
