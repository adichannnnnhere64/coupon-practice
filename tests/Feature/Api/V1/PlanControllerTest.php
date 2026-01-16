<?php

namespace Tests\Feature\Api\V1;

use App\Models\Plan;
use App\Models\PlanType;
use App\Models\PlanAttribute;
use App\Models\PlanInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('PlanController', function () {
    describe('GET /api/v1/plans', function () {
        it('returns all active plans', function () {
            Plan::factory()->count(5)->create(['is_active' => true]);
            Plan::factory()->count(2)->create(['is_active' => false]);

            $response = $this->getJson('/api/v1/plans');

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'actual_price',
                            'base_price',
                            'is_active',
                        ]
                    ]
                ])
                ->assertJsonCount(5, 'data');
        });

        it('filters plans by plan type', function () {
            $planType1 = PlanType::factory()->create();
            $planType2 = PlanType::factory()->create();

            Plan::factory()->count(3)->create([
                'plan_type_id' => $planType1->id,
                'is_active' => true,
            ]);

            Plan::factory()->count(2)->create([
                'plan_type_id' => $planType2->id,
                'is_active' => true,
            ]);

            $response = $this->getJson("/api/v1/plans?plan_type_id={$planType1->id}");

            $response->assertStatus(200)
                ->assertJsonCount(3, 'data')
                ->assertJsonPath('data.0.plan_type_id', $planType1->id);
        });

        it('filters plans by price range', function () {
            Plan::factory()->create(['actual_price' => 10.00, 'is_active' => true]);
            Plan::factory()->create(['actual_price' => 25.00, 'is_active' => true]);
            Plan::factory()->create(['actual_price' => 50.00, 'is_active' => true]);
            Plan::factory()->create(['actual_price' => 100.00, 'is_active' => true]);

            $response = $this->getJson('/api/v1/plans?min_price=20&max_price=75');

            $response->assertStatus(200)
                ->assertJsonCount(2, 'data');
        });

        it('filters plans by multiple criteria', function () {
            $planType = PlanType::factory()->create();

            Plan::factory()->create([
                'plan_type_id' => $planType->id,
                'actual_price' => 30.00,
                'is_active' => true,
            ]);

            Plan::factory()->create([
                'plan_type_id' => $planType->id,
                'actual_price' => 80.00,
                'is_active' => true,
            ]);

            Plan::factory()->create([
                'plan_type_id' => $planType->id,
                'actual_price' => 120.00,
                'is_active' => false,
            ]);

            $response = $this->getJson("/api/v1/plans?plan_type_id={$planType->id}&min_price=25&max_price=100");

            $response->assertStatus(200)
                ->assertJsonCount(2, 'data');
        });
    });

    describe('GET /api/v1/plans/{plan}', function () {
        it('returns single plan with attributes', function () {
            $plan = Plan::factory()->create(['is_active' => true]);

            $attribute = PlanAttribute::factory()->create();
            $plan->attributes()->attach($attribute->id, [
                'value' => 'Unlimited',
                'is_unlimited' => true,
            ]);

            $response = $this->getJson("/api/v1/plans/{$plan->id}");

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id',
                        'name',
                        'actual_price',
                        'attributes' => [
                            '*' => [
                                'name',
                                'value',
                                'is_unlimited',
                            ]
                        ],
                        'plan_type' => [
                            'id',
                            'name',
                        ]
                    ]
                ])
                ->assertJsonPath('data.id', $plan->id);
        });

        it('calculates discount percentage correctly', function () {
            $plan = Plan::factory()->create([
                'base_price' => 100.00,
                'actual_price' => 80.00,
                'is_active' => true,
            ]);

            $response = $this->getJson("/api/v1/plans/{$plan->id}");

            $response->assertStatus(200)
                ->assertJsonPath('data.discount_percentage', 20);
        });

        it('returns 404 for non-existent plan', function () {
            $response = $this->getJson('/api/v1/plans/999');

            $response->assertStatus(404);
        });

        it('returns inactive plan when requested directly', function () {
            $plan = Plan::factory()->create(['is_active' => false]);

            $response = $this->getJson("/api/v1/plans/{$plan->id}");

            $response->assertStatus(200)
                ->assertJsonPath('data.is_active', false);
        });
    });

    describe('GET /api/v1/plans/{plan}/inventory', function () {
        it('returns plan inventory summary', function () {
            $plan = Plan::factory()->create(['is_active' => true]);

            PlanInventory::factory()->count(5)->available()->create(['plan_id' => $plan->id]);
            PlanInventory::factory()->count(2)->sold()->create(['plan_id' => $plan->id]);

            $response = $this->getJson("/api/v1/plans/{$plan->id}/inventory");

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'plan' => [
                            'id',
                            'name',
                        ],
                        'stock_summary' => [
                            'total',
                            'available',
                            'available_codes',
                        ]
                    ]
                ])
                ->assertJsonPath('data.stock_summary.total', 7)
                ->assertJsonPath('data.stock_summary.available', 5)
                ->assertJsonCount(5, 'data.stock_summary.available_codes');
        });

        it('limits available inventory codes', function () {
            $plan = Plan::factory()->create(['is_active' => true]);

            PlanInventory::factory()->count(10)->available()->create(['plan_id' => $plan->id]);

            $response = $this->getJson("/api/v1/plans/{$plan->id}/inventory?limit=3");

            $response->assertStatus(200)
                ->assertJsonCount(3, 'data.stock_summary.available_codes');
        });

        it('returns empty available codes when no inventory', function () {
            $plan = Plan::factory()->create(['is_active' => true]);

            $response = $this->getJson("/api/v1/plans/{$plan->id}/inventory");

            $response->assertStatus(200)
                ->assertJsonPath('data.stock_summary.total', 0)
                ->assertJsonPath('data.stock_summary.available', 0)
                ->assertJsonCount(0, 'data.stock_summary.available_codes');
        });
    });
});
