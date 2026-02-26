<?php

namespace App\Filament\Resources\DeliveryMethod\Pages;

use App\Filament\Resources\DeliveryMethods\DeliveryMethodResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewDeliveryMethod extends ViewRecord
{
    protected static string $resource = DeliveryMethodResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
