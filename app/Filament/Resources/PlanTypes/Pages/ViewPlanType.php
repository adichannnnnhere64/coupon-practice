<?php

namespace App\Filament\Resources\PlanTypes\Pages;

use App\Filament\Resources\PlanTypes\PlanTypeResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewPlanType extends ViewRecord
{
    protected static string $resource = PlanTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
