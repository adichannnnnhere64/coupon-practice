<?php

namespace App\Filament\Resources\PlanInventories\Pages;

use App\Filament\Resources\PlanInventories\PlanInventoryResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewPlanInventory extends ViewRecord
{
    protected static string $resource = PlanInventoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
