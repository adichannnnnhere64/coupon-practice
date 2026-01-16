<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\PlanType;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'plan_type_id' => PlanType::factory(),
            'name' => $this->faker->words(3, true),
            'base_price' => $this->faker->randomFloat(2, 10, 1000),
            'actual_price' => function (array $attributes) {
                return $this->faker->randomFloat(2, $attributes['base_price'] * 0.8, $attributes['base_price']);
            },
            'description' => $this->faker->paragraph(),
            'is_active' => true,
        ];
    }

    public function inactive(): self
    {
        return $this->state([
            'is_active' => false,
        ]);
    }
}
