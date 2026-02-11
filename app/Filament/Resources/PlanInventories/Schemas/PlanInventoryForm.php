<?php

namespace App\Filament\Resources\PlanInventories\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Components\Section;
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
                    ->default(fn ($livewire) => $livewire instanceof RelationManager
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
        3 => 'Sold',     // CORRECT: 3 = Sold
        4 => 'Expired',  // CORRECT: 4 = Expired
    ])

                    ->native(false),
                DateTimePicker::make('purchased_at')->native(false),
                DateTimePicker::make('sold_at')->native(false),
                DateTimePicker::make('expires_at')->native(false),

                Section::make('Meta Data')
                    ->description('Additional information for this inventory item')
                    ->collapsible()
                    ->schema([
                        KeyValue::make('meta_data')
                            ->keyLabel('Key')
                            ->valueLabel('Value')
                            ->addButtonLabel('Add Field')
                            ->reorderable()
                            ->columnSpanFull()
                            ->afterStateHydrated(function ($component, $state) {
                                // Handle double-encoded JSON from database
                                if (is_string($state)) {
                                    // Try to decode once
                                    $decoded = json_decode($state, true);

                                    // If it's still a string, decode again (double-encoded)
                                    if (is_string($decoded)) {
                                        $decoded = json_decode($decoded, true);
                                    }

                                    $component->state(is_array($decoded) ? $decoded : []);
                                } elseif (is_array($state)) {
                                    $component->state($state);
                                } else {
                                    $component->state([]);
                                }
                            })
                            ->dehydrateStateUsing(function ($state) {
                                // Ensure we save as clean JSON object, not double-encoded
                                if (is_array($state)) {
                                    return $state; // Let Eloquent casting handle the JSON encoding
                                }
                                return [];
                            }),
                    ]),

            ]);
    }
}
