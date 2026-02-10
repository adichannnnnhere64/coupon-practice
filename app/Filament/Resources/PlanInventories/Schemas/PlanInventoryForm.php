<?php

namespace App\Filament\Resources\PlanInventories\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;

class PlanInventoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                      // RelationManager: auto-assign plan
        Hidden::make('plan_id')
            ->visible(fn ($livewire) => $livewire instanceof RelationManager)
            ->default(fn ($livewire) =>
                $livewire instanceof RelationManager
                    ? $livewire->getOwnerRecord()->id
                    : null
            ),

        // Normal create/edit: user selects plan
        Select::make('plan_id')
            ->visible(fn ($livewire) => ! ($livewire instanceof RelationManager))
            ->relationship('plan', 'name')
            ->searchable()
            ->preload()
            ->required()
            ->createOptionForm([
                TextInput::make('name')->required(),
                TextInput::make('description')->required(),
            ]),


                TextInput::make('code')
                    ->columnSpanFull()
                    ->required(),

                SpatieMediaLibraryFileUpload::make('coupon')
        ->collection('coupon')
        ->disk('private') // important
        ->maxSize(5120)
        ->columnSpanFull(),
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
