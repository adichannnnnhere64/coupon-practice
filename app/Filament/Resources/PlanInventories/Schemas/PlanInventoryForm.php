<?php

namespace App\Filament\Resources\PlanInventories\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PlanInventoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                Select::make('plan_id')
                    ->relationship(name: 'plan', titleAttribute: 'name')
                    ->createOptionForm([
                        TextInput::make('name')
                            ->required(),
                        TextInput::make('description')
                            ->required(),
                    ])
                    ->searchable()
                    ->preload()
                    ->loadingMessage('Loading operators...'),
                TextInput::make('code')
                    ->required(),
                Select::make('status')
                    ->options([
                        1 => 'Available',
                        2 => 'Reserved',
                        3 => 'Expired',
                        4 => 'Sold',
                    ])
                    ->native(false),
                DateTimePicker::make('purchased_at')->native(false),
                DateTimePicker::make('sold_at')->native(false),
                DateTimePicker::make('expires_at')->native(false),
                Textarea::make('meta_data')
                    ->columnSpanFull(),
            ]);
    }
}
