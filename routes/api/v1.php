<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PlanController;
use App\Http\Controllers\Api\V1\PlanTypeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
|
| Routes for API version 1.
|
*/

// Public routes with auth rate limiter (5/min - brute force protection)
Route::middleware('throttle:auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->name('api.v1.register');
    Route::post('login', [AuthController::class, 'login'])->name('api.v1.login');
});

Route::middleware('throttle:api')->group(function () {
    // Plan Types
    Route::get('plan-types', [PlanTypeController::class, 'index'])->name('api.v1.plan-types.index');
    Route::get('plan-types/{planType}', [PlanTypeController::class, 'show'])->name('api.v1.plan-types.show');
    Route::get('plan-types/{planType}/plans', [PlanTypeController::class, 'plans'])->name('api.v1.plan-types.plans');

    // Plans
    Route::get('plans', [PlanController::class, 'index'])->name('api.v1.plans.index');
    Route::get('plans/{plan}', [PlanController::class, 'show'])->name('api.v1.plans.show');
    Route::get('plans/{plan}/inventory', [PlanController::class, 'inventory'])->name('api.v1.plans.inventory');
});

// Protected routes with authenticated rate limiter (120/min)
Route::middleware(['auth:sanctum', 'throttle:authenticated'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('api.v1.logout');
    Route::get('me', [AuthController::class, 'me'])->name('api.v1.me');
});
