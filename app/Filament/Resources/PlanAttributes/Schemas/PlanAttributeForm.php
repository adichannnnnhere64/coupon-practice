<?php

namespace App\Filament\Resources\PlanAttributes\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class PlanAttributeForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('slug')
                    ->required(),
                TextInput::make('type')
                    ->required()
                    ->default('text'),
                TextInput::make('unit'),
                Textarea::make('description')
                    ->columnSpanFull(),
            ]);
    }
}
