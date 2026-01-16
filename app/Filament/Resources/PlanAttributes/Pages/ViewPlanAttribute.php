<?php

namespace App\Filament\Resources\PlanAttributes\Pages;

use App\Filament\Resources\PlanAttributes\PlanAttributeResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewPlanAttribute extends ViewRecord
{
    protected static string $resource = PlanAttributeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
