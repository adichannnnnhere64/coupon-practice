<?php

namespace App\Services\Delivery;

use App\Models\DeliveryMethod;
use App\Models\PlanInventory;
use App\Models\User;

interface DeliveryDriverInterface
{
    /**
     * Set the delivery method configuration
     */
    public function setMethod(DeliveryMethod $method): self;

    /**
     * Deliver the inventory item to the user
     */
    public function deliver(PlanInventory $inventory, User $user): DeliveryResult;

    /**
     * Check if the driver supports the given delivery method type
     */
    public function supports(string $type): bool;

    /**
     * Validate the delivery method credentials
     */
    public function validateCredentials(array $credentials): bool;
}
