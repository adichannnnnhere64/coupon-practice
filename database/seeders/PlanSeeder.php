<?php

namespace Database\Seeders;

use App\Models\PlanType;
use App\Models\Plan;
use App\Models\PlanAttribute;
use App\Models\PlanInventory;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // Create plan types
        $mobileType = PlanType::create([
            'name' => 'Mobile Plans',
            'slug' => 'mobile-plans',
            'description' => 'Prepaid and postpaid mobile internet plans',
            'is_active' => true,
        ]);

        $wifiType = PlanType::create([
            'name' => 'WiFi Plans',
            'slug' => 'wifi-plans',
            'description' => 'Home and business WiFi internet plans',
            'is_active' => true,
        ]);

        // Create plan attributes
        $attributes = [
            'data' => PlanAttribute::create([
                'name' => 'Data Allowance',
                'slug' => 'data',
                'type' => 'text',
                'unit' => 'GB',
                'description' => 'Monthly data allowance',
            ]),
            'speed' => PlanAttribute::create([
                'name' => 'Internet Speed',
                'slug' => 'speed',
                'type' => 'text',
                'unit' => 'Mbps',
                'description' => 'Maximum internet speed',
            ]),
            'validity' => PlanAttribute::create([
                'name' => 'Validity Period',
                'slug' => 'validity',
                'type' => 'text',
                'unit' => 'days',
                'description' => 'Plan validity period',
            ]),
        ];

        // Create mobile plans
        $mobilePlans = [
            [
                'name' => 'Basic Mobile',
                'base_price' => 20.00,
                'actual_price' => 15.00,
                'description' => 'Basic mobile data plan',
                'attributes' => [
                    'data' => ['value' => '2GB', 'is_unlimited' => false],
                    'validity' => ['value' => '7', 'is_unlimited' => false],
                ],
            ],
            [
                'name' => 'Standard Mobile',
                'base_price' => 50.00,
                'actual_price' => 40.00,
                'description' => 'Standard mobile data plan',
                'attributes' => [
                    'data' => ['value' => '10GB', 'is_unlimited' => false],
                    'validity' => ['value' => '30', 'is_unlimited' => false],
                ],
            ],
            [
                'name' => 'Premium Mobile',
                'base_price' => 100.00,
                'actual_price' => 80.00,
                'description' => 'Premium unlimited mobile data',
                'attributes' => [
                    'data' => ['value' => null, 'is_unlimited' => true],
                    'validity' => ['value' => '30', 'is_unlimited' => false],
                ],
            ],
        ];

        foreach ($mobilePlans as $planData) {
            $plan = Plan::create([
                'plan_type_id' => $mobileType->id,
                'name' => $planData['name'],
                'base_price' => $planData['base_price'],
                'actual_price' => $planData['actual_price'],
                'description' => $planData['description'],
                'is_active' => true,
            ]);

            foreach ($planData['attributes'] as $attrSlug => $attrData) {
                $plan->attributes()->attach($attributes[$attrSlug]->id, $attrData);
            }

            // Add inventory
            PlanInventory::factory()->count(rand(5, 20))->available()->create(['plan_id' => $plan->id]);
        }

        // Create WiFi plans
        $wifiPlans = [
            [
                'name' => 'Basic WiFi',
                'base_price' => 300.00,
                'actual_price' => 250.00,
                'description' => 'Basic home WiFi',
                'attributes' => [
                    'speed' => ['value' => '25', 'is_unlimited' => false],
                    'data' => ['value' => '100GB', 'is_unlimited' => false],
                ],
            ],
            [
                'name' => 'Pro WiFi',
                'base_price' => 600.00,
                'actual_price' => 500.00,
                'description' => 'Professional WiFi for small business',
                'attributes' => [
                    'speed' => ['value' => '100', 'is_unlimited' => false],
                    'data' => ['value' => '500GB', 'is_unlimited' => false],
                ],
            ],
        ];

        foreach ($wifiPlans as $planData) {
            $plan = Plan::create([
                'plan_type_id' => $wifiType->id,
                'name' => $planData['name'],
                'base_price' => $planData['base_price'],
                'actual_price' => $planData['actual_price'],
                'description' => $planData['description'],
                'is_active' => true,
            ]);

            foreach ($planData['attributes'] as $attrSlug => $attrData) {
                $plan->attributes()->attach($attributes[$attrSlug]->id, $attrData);
            }

            // Add inventory
            PlanInventory::factory()->count(rand(3, 10))->available()->create(['plan_id' => $plan->id]);
        }
    }
}
