<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\PlanTypeResource;
use App\Http\Resources\PlanResource;
use App\Models\PlanType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanTypeController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $planTypes = PlanType::with('plans')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success(PlanTypeResource::collection($planTypes));
    }

    public function show(PlanType $planType): JsonResponse
    {
        $planType->load('plans.attributes');

        return $this->success(new PlanTypeResource($planType));
    }

    public function plans(PlanType $planType, Request $request): JsonResponse
    {
        $plans = $planType->plans()
            ->with(['attributes', 'media'])
            ->where('is_active', true)
            ->orderBy('actual_price')
            ->get();

        return $this->success([
            'plan_type' => new PlanTypeResource($planType),
            'plans' => PlanResource::collection($plans),
        ]);
    }
}
