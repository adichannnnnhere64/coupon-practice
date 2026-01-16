<?php

// tests/Feature/PlanTest.php

use App\Models\Plan;
use App\Models\PlanType;
use App\Models\PlanAttribute;
use App\Services\PlanService;
use App\Models\PlanInventory;
use App\Services\PlanInventoryService;

beforeEach(function () {
    $this->planService = app(PlanService::class);
});

it('can create a plan', function () {
    $planType = PlanType::factory()->create();

    $data = [
        'plan_type_id' => $planType->id,
        'name' => 'Test Plan',
        'base_price' => 50.00,
        'actual_price' => 45.00,
        'description' => 'Test description',
        'is_active' => true,
    ];

    $plan = $this->planService->createPlan($data);

    expect($plan)->toBeInstanceOf(Plan::class)
        ->and($plan->name)->toBe('Test Plan')
        ->and($plan->base_price)->toBe('50.00')
        ->and($plan->actual_price)->toBe('45.00');
});

it('can attach attributes to plan', function () {
    $plan = Plan::factory()->create();
    $attribute = PlanAttribute::factory()->create(['slug' => 'data']);

    $attributes = [
        $attribute->id => [
            'value' => '10',
            'is_unlimited' => false,
        ],
    ];

    $this->planService->attachAttributesToPlan($plan, $attributes);

    expect($plan->attributes)->toHaveCount(1)
        ->and($plan->attributes->first()->pivot->value)->toBe('10');
});

it('can get plans by plan type', function () {
    $planType = PlanType::factory()->create();
    Plan::factory()->count(3)->create(['plan_type_id' => $planType->id]);
    Plan::factory()->count(2)->create(); // Different plan type

    $plans = $this->planService->getPlansByType($planType->id);

    expect($plans)->toHaveCount(3)
        ->and($plans->first()->plan_type_id)->toBe($planType->id);
});

it('can update plan', function () {
    $plan = Plan::factory()->create(['name' => 'Old Name']);

    $updated = $this->planService->updatePlan($plan->id, [
        'name' => 'New Name',
        'actual_price' => 99.99,
    ]);

    expect($updated->name)->toBe('New Name')
        ->and($updated->actual_price)->toBe('99.99');
});


it('cannot delete plan with existing inventory', function () {
    $plan = Plan::factory()->create();

    // Use the correct relationship name: 'inventories' not 'planInventory'
    PlanInventory::factory()->count(1)->create(['plan_id' => $plan->id]);

    $this->planService->deletePlan($plan->id);
})->throws(\Exception::class, 'Cannot delete plan with existing inventory');

it('can get active plans only', function () {
    Plan::factory()->count(3)->create(['is_active' => true]);
    Plan::factory()->count(2)->inactive()->create();

    $activePlans = $this->planService->getActivePlans();

    expect($activePlans)->toHaveCount(3)
        ->and($activePlans->every(fn ($plan) => $plan->is_active))->toBeTrue();
});

it('calculates available stock correctly', function () {
    $plan = Plan::factory()->create();
    \App\Models\PlanInventory::factory()->count(5)->available()->create(['plan_id' => $plan->id]);
    \App\Models\PlanInventory::factory()->count(3)->sold()->create(['plan_id' => $plan->id]);

    $plan = $plan->fresh();

    expect($plan->available_stock)->toBe(5)
        ->and($plan->total_stock)->toBe(8);
});

// tests/Feature/PlanInventoryTest.php



beforeEach(function () {
    $this->inventoryService = app(PlanInventoryService::class);
});

it('can add inventory with code', function () {
    $plan = Plan::factory()->create();

    $inventory = $this->inventoryService->addInventory(
        $plan->id,
        'TEST123456',
        ['meta_data' => ['batch' => 'B001']]
    );

    expect($inventory)->toBeInstanceOf(PlanInventory::class)
        ->and($inventory->code)->toBe('TEST123456')
        ->and($inventory->status)->toBe('available')
        ->and($inventory->plan_id)->toBe($plan->id);
});

it('can bulk add inventory', function () {
    $plan = Plan::factory()->create();
    $codes = ['CODE1', 'CODE2', 'CODE3'];

    $inventories = $this->inventoryService->bulkAddInventory($plan->id, $codes);

    expect($inventories)->toHaveCount(3)
        ->and($inventories->pluck('code')->toArray())->toBe($codes);
});

it('can generate and add inventory', function () {
    $plan = Plan::factory()->create();

    $inventories = $this->inventoryService->generateAndAddInventory($plan->id, 5, 'PLAN-');

    expect($inventories)->toHaveCount(5)
        ->and($inventories->every(fn ($inv) => str_starts_with($inv->code, 'PLAN-')))->toBeTrue();
});

it('can reserve inventory', function () {
    $inventory = PlanInventory::factory()->available()->create();

    $reserved = $this->inventoryService->reserveInventory($inventory->code);

    expect($reserved->status)->toBe('reserved');
});

it('cannot reserve non-available inventory', function () {
    $inventory = PlanInventory::factory()->sold()->create();

    $this->inventoryService->reserveInventory($inventory->code);
})->throws(\Exception::class, 'Inventory is not available');

it('can sell inventory', function () {
    $inventory = PlanInventory::factory()->available()->create();

    $sold = $this->inventoryService->sellInventory($inventory->code);

    expect($sold->status)->toBe('sold')
        ->and($sold->sold_at)->not->toBeNull();
});

it('can sell reserved inventory', function () {
    $inventory = PlanInventory::factory()->reserved()->create();

    $sold = $this->inventoryService->sellInventory($inventory->code);

    expect($sold->status)->toBe('sold');
});

it('gets correct stock levels', function () {
    $plan = Plan::factory()->create();

    PlanInventory::factory()->count(10)->available()->create(['plan_id' => $plan->id]);
    PlanInventory::factory()->count(5)->sold()->create(['plan_id' => $plan->id]);
    PlanInventory::factory()->count(2)->reserved()->create(['plan_id' => $plan->id]);

    $stockLevel = $this->inventoryService->getStockLevel($plan->id);

    expect($stockLevel)
        ->toHaveKey('total', 17)
        ->toHaveKey('available', 10)
        ->toHaveKey('sold', 5)
        ->toHaveKey('reserved', 2);
});

it('can get available inventory by plan', function () {
    $plan = Plan::factory()->create();

    PlanInventory::factory()->count(5)->available()->create(['plan_id' => $plan->id]);
    PlanInventory::factory()->count(3)->sold()->create(['plan_id' => $plan->id]);

    $available = $this->inventoryService->getAvailableInventory($plan->id);

    expect($available)->toHaveCount(5)
        ->and($available->every(fn ($inv) => $inv->status === 'available'))->toBeTrue();
});

it('can limit available inventory results', function () {
    $plan = Plan::factory()->create();
    PlanInventory::factory()->count(10)->available()->create(['plan_id' => $plan->id]);

    $available = $this->inventoryService->getAvailableInventory($plan->id, 3);

    expect($available)->toHaveCount(3);
});
