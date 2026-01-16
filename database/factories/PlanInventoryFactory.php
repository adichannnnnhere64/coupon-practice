<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\PlanInventory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PlanInventoryFactory extends Factory
{
    protected $model = PlanInventory::class;

    public function definition(): array
    {
        return [
            'plan_id' => Plan::factory(),
            'code' => Str::upper(Str::random(12)),
            'status' => 'available',
            'meta_data' => null,
        ];
    }

    public function available(): self
    {
        return $this->state([
            'status' => 'available',
        ]);
    }

    public function sold(): self
    {
        return $this->state([
            'status' => 'sold',
            'sold_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ]);
    }

    public function reserved(): self
    {
        return $this->state([
            'status' => 'reserved',
        ]);
    }
}
