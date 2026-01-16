<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Repositories\PlanRepository::class,
            fn($app) => new \App\Repositories\PlanRepository(new \App\Models\Plan())
        );

        $this->app->bind(
            \App\Repositories\PlanInventoryRepository::class,
            fn($app) => new \App\Repositories\PlanInventoryRepository(new \App\Models\PlanInventory())
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
