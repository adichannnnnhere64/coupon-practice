<?php

namespace App\Filament\Resources\PlanAttributes\Pages;

use App\Filament\Resources\PlanAttributes\PlanAttributeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPlanAttributes extends ListRecords
{
    protected static string $resource = PlanAttributeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
