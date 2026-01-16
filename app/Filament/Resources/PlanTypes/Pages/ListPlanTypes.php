<?php

namespace App\Filament\Resources\PlanTypes\Pages;

use App\Filament\Resources\PlanTypes\PlanTypeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPlanTypes extends ListRecords
{
    protected static string $resource = PlanTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
