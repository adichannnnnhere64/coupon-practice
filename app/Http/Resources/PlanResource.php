<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Plan
 */
class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plan_type_id' => $this->plan_type_id,
            'name' => $this->name,
            'description' => $this->description,
            'base_price' => (float) $this->base_price,
            'actual_price' => (float) $this->actual_price,
            'is_active' => $this->is_active,
            'discount_percentage' => $this->when($this->base_price > 0,
                fn() => round((1 - $this->actual_price / $this->base_price) * 100, 2)
            ),
            'attributes' => PlanAttributeResource::collection($this->whenLoaded('attributes')),
            'plan_type' => new PlanTypeResource($this->whenLoaded('planType')),
            'media' => $this->whenLoaded('media', function () {
                return $this->getMedia('images')->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'url' => $media->getUrl(),
                        'thumb_url' => $media->getUrl('thumb'),
                        'name' => $media->name,
                        'size' => $media->size,
                        'mime_type' => $media->mime_type,
                    ];
                });
            }),
            'stock_summary' => $this->when($request->has('include_stock'), [
                'total' => $this->total_stock,
                'available' => $this->available_stock,
            ]),
            'meta_data' => $this->meta_data,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
