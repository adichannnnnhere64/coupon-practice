<?php

namespace Database\Factories;

use App\Models\PlanAttribute;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanAttributeFactory extends Factory
{
    protected $model = PlanAttribute::class;

    public function definition(): array
    {
        $attributes = [
            ['name' => 'Talk Time', 'slug' => 'talk-time', 'type' => 'number', 'unit' => 'minutes'],
            ['name' => 'SMS', 'slug' => 'sms', 'type' => 'number', 'unit' => 'texts'],
            ['name' => 'Data', 'slug' => 'data', 'type' => 'number', 'unit' => 'GB'],
            ['name' => 'Call Unlimited', 'slug' => 'call-unlimited', 'type' => 'boolean', 'unit' => null],
            ['name' => 'SMS Unlimited', 'slug' => 'sms-unlimited', 'type' => 'boolean', 'unit' => null],
        ];

        $selected = $this->faker->randomElement($attributes);

        return array_merge($selected, [
            'description' => $this->faker->sentence(),
        ]);
    }
}

