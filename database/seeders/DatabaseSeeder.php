<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            // PlanSeeder::class, // Basic seeder with minimal data
            FullCatalogSeeder::class, // Full catalog with categories, plans, inventory and images
            PaymentGatewaySeeder::class
        ]);


    }
}
