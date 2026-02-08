<?php

use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PaymentGatewayController;
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


Route::prefix('payment')->group(function () {
    // Public routes
    Route::get('/gateways', [PaymentGatewayController::class, 'index'])
        ->name('payment.gateways.index');

    Route::get('/gateways/{identifier}', [PaymentGatewayController::class, 'show'])
        ->name('payment.gateways.show');

    Route::get('/gateways/checkout', [PaymentGatewayController::class, 'checkout'])
        ->name('payment.gateways.checkout');

    // Payment webhooks (no authentication needed)
    Route::post('/webhook/{gateway}', [PaymentController::class, 'handleWebhook'])
        ->name('payment.webhook');

    // Protected payment routes
    Route::middleware('auth:sanctum')->group(function () {
        // Payment initiation
        Route::post('/initiate', [PaymentController::class, 'initiate'])
            ->name('payment.initiate');

        // Payment verification
        Route::post('/verify', [PaymentController::class, 'verify'])
            ->name('payment.verify');

        // Payment refund
        Route::post('/refund', [PaymentController::class, 'refund'])
            ->name('payment.refund');

        // Get payment details
        Route::get('/transactions', [PaymentController::class, 'transactions'])
            ->name('payment.transactions');

        Route::get('/transactions/{id}', [PaymentController::class, 'transactionDetails'])
            ->name('payment.transaction.details');

        // Payment callback URLs
        Route::get('/callback', [PaymentController::class, 'callback'])
            ->name('payment.callback');

        Route::get('/cancel', [PaymentController::class, 'cancel'])
            ->name('payment.cancel');

        Route::get('/success', [PaymentController::class, 'success'])
            ->name('payment.success');

        // Admin routes
        Route::middleware(['can:manage-payments'])->group(function () {
            Route::patch('/gateways/{id}/toggle', [PaymentGatewayController::class, 'toggleStatus'])
                ->name('payment.gateways.toggle');

            Route::patch('/gateways/{id}/priority', [PaymentGatewayController::class, 'updatePriority'])
                ->name('payment.gateways.priority');

            Route::get('/gateways/{id}/configuration', [PaymentGatewayController::class, 'configuration'])
                ->name('payment.gateways.configuration');
        });
    });
});


// Protected routes with authenticated rate limiter (120/min)
Route::middleware(['auth:sanctum', 'throttle:authenticated'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('api.v1.logout');
    Route::get('me', [AuthController::class, 'me'])->name('api.v1.me');
});
