<?php

namespace App\Filament\Resources\PlanInventories\Pages;

use App\Filament\Resources\PlanInventories\PlanInventoryResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPlanInventories extends ListRecords
{
    protected static string $resource = PlanInventoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
