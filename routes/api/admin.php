<?php

use App\Http\Controllers\Api\V1\Admin\CategoryController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\InventoryController;
use App\Http\Controllers\Api\V1\Admin\PlanController;
use App\Http\Controllers\Api\V1\Admin\PlanTypeController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Controllers\Api\V1\Admin\SettingsController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');

    // Users
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');

    // Categories (Operators)
    Route::apiResource('categories', CategoryController::class);
    Route::post('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus'])->name('categories.toggle-status');

    // Plan Types
    Route::apiResource('plan-types', PlanTypeController::class);
    Route::post('plan-types/{planType}/toggle-status', [PlanTypeController::class, 'toggleStatus'])->name('plan-types.toggle-status');

    // Plans
    Route::apiResource('plans', PlanController::class);
    Route::post('plans/{plan}/toggle-status', [PlanController::class, 'toggleStatus'])->name('plans.toggle-status');

    // Inventory (Coupons)
    Route::apiResource('inventory', InventoryController::class)->parameters(['inventory' => 'inventory']);
    Route::post('inventory/bulk-import', [InventoryController::class, 'bulkImport'])->name('inventory.bulk-import');
    Route::post('inventory/bulk-delete', [InventoryController::class, 'bulkDelete'])->name('inventory.bulk-delete');

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('sales', [ReportController::class, 'sales'])->name('sales');
        Route::get('wallet-transactions', [ReportController::class, 'walletTransactions'])->name('wallet-transactions');
        Route::get('revenue', [ReportController::class, 'revenue'])->name('revenue');
        Route::get('users', [ReportController::class, 'userReport'])->name('users');
    });

    // Settings
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::get('settings/print', [SettingsController::class, 'printSettings'])->name('settings.print');
    Route::put('settings/print', [SettingsController::class, 'updatePrintSettings'])->name('settings.print.update');
});
