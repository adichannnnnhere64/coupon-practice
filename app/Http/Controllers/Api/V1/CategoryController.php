<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\PlanTypeResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends ApiController
{
    /**
     * Get all active categories
     */
    public function index(Request $request): JsonResponse
    {
        $categories = Category::with('planTypes')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success(CategoryResource::collection($categories));
    }

    /**
     * Get a single category
     */
    public function show(Category $category): JsonResponse
    {
        $category->load('planTypes');

        return $this->success(new CategoryResource($category));
    }

    /**
     * Get plan types for a category
     */
    public function planTypes(Category $category, Request $request): JsonResponse
    {
        $planTypes = $category->planTypes()
            ->with('plans')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success([
            'category' => new CategoryResource($category),
            'plan_types' => PlanTypeResource::collection($planTypes),
        ]);
    }
}
