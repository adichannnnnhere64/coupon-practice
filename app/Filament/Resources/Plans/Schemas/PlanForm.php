<?php

namespace App\Filament\Resources\Plans\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Select;

class PlanForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('plan_type_id')
                    ->relationship(name: 'planType', titleAttribute: 'name')
                    ->createOptionForm([
                        TextInput::make('name')
                            ->required(),
                        TextInput::make('slug')
                            ->required(),
                        TextInput::make('description')
                            ->required(),
                    ])
                    ->searchable()
                    ->preload()
                    ->loadingMessage('Loading operators...'),
                TextInput::make('name')
                    ->required(),
                TextInput::make('base_price')
                    ->required()
                    ->numeric()
                    ->prefix('$'),
                TextInput::make('actual_price')
                    ->required()
                    ->numeric()
                    ->prefix('$'),
                Textarea::make('description')
                    ->columnSpanFull(),
                Textarea::make('meta_data')
                    ->columnSpanFull(),
                Toggle::make('is_active')
                    ->required(),
            ]);
    }
}
