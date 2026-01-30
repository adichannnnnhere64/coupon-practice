<?php

namespace Tests\Feature\Api\V1;

use App\Models\PlanType;
use App\Models\Plan;
use App\Models\PlanAttribute;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('PlanTypeController', function () {
    describe('GET /api/v1/plan-types', function () {
        it('returns all active plan types', function () {
            PlanType::factory()->count(3)->create(['is_active' => true]);
            PlanType::factory()->count(2)->create(['is_active' => false]);

            $response = $this->getJson('/api/v1/plan-types');

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'slug',
                            'description',
                            'is_active',
                            'plans_count',
                        ]
                    ]
                ])
                ->assertJsonCount(3, 'data');
        });

        it('returns empty array when no active plan types', function () {
            PlanType::factory()->count(2)->create(['is_active' => false]);

            $response = $this->getJson('/api/v1/plan-types');

            $response->assertStatus(200)
                ->assertJsonCount(0, 'data');
        });
    });

    describe('GET /api/v1/plan-types/{planType}', function () {
        it('returns single plan type with plans', function () {
            $planType = PlanType::factory()->create(['is_active' => true]);

            Plan::factory()->count(2)->create([
                'plan_type_id' => $planType->id,
                'is_active' => true,
            ]);

            $response = $this->getJson("/api/v1/plan-types/{$planType->id}");

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id',
                        'name',
                        'slug',
                        'plan_types',
                    ]
                ])
                ->assertJsonPath('data.id', $planType->id);
        });

        it('returns 404 for non-existent plan type', function () {
            $response = $this->getJson('/api/v1/plan-types/999');

            $response->assertStatus(404);
        });

        it('returns inactive plan type when requested directly', function () {
            $planType = PlanType::factory()->create(['is_active' => false]);

            $response = $this->getJson("/api/v1/plan-types/{$planType->id}");

            $response->assertStatus(200)
                ->assertJsonPath('data.is_active', false);
        });
    });

    describe('GET /api/v1/plan-types/{planType}/plans', function () {
        it('returns plans for specific plan type with attributes', function () {
            $planType = PlanType::factory()->create(['is_active' => true]);

            $plans = Plan::factory()->count(3)->create([
                'plan_type_id' => $planType->id,
                'is_active' => true,
            ]);

            $attribute = PlanAttribute::factory()->create();
            foreach ($plans as $plan) {
                $plan->attributes()->attach($attribute->id, [
                    'value' => '10GB',
                    'is_unlimited' => false,
                ]);
            }

            $response = $this->getJson("/api/v1/plan-types/{$planType->id}/plans");

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'plan_type' => [
                            'id',
                            'name',
                        ],
                        'plans' => [
                            '*' => [
                                'id',
                                'name',
                                'actual_price',
                                'attributes' => [
                                    '*' => [
                                        'name',
                                        'value',
                                    ]
                                ]
                            ]
                        ]
                    ]
                ])
                ->assertJsonCount(3, 'data.plans');
        });

        it('returns only active plans for plan type', function () {
            $planType = PlanType::factory()->create(['is_active' => true]);

            Plan::factory()->count(2)->create([
                'plan_type_id' => $planType->id,
                'is_active' => true,
            ]);

            Plan::factory()->count(3)->create([
                'plan_type_id' => $planType->id,
                'is_active' => false,
            ]);

            $response = $this->getJson("/api/v1/plan-types/{$planType->id}/plans");

            $response->assertStatus(200)
                ->assertJsonCount(2, 'data.plans');
        });

        it('returns empty array for inactive plan type', function () {
            $planType = PlanType::factory()->create(['is_active' => false]);

            Plan::factory()->count(2)->create([
                'plan_type_id' => $planType->id,
                'is_active' => false,
            ]);

            $response = $this->getJson("/api/v1/plan-types/{$planType->id}/plans");

            $response->assertStatus(200)
                ->assertJsonCount(0, 'data.plans');
        });
    });
});
