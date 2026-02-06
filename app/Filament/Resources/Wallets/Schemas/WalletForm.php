<?php

namespace App\Filament\Resources\Wallets\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WalletForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                // Owner selection (polymorphic)
                Select::make('owner_type')
                    ->label('Owner Type')
                    ->options([
                        \App\Models\User::class => 'User',
                        // Add other possible morph targets here
                    ])
                    ->required()
                    ->reactive(), // updates owner_id options dynamically

                Select::make('owner_id')
                    ->label('Owner')
                    ->options(function (callable $get) {
                        $type = $get('owner_type');
                        if (!$type) return [];

                        return $type::all()->pluck('name', 'id')->toArray();
                        // If your model doesn’t have `name`, adjust attribute
                    })
                    ->required()
                    ->searchable()
                    ->preload(),
                    /* ->dependsOn(['owner_type']), */

                TextInput::make('balance')
                    ->label('Balance')
                    ->numeric()
                    ->required()
                    ->prefix('$')
                    ->default(0),

                Textarea::make('meta')
                    ->label('Meta Data')
                    ->columnSpanFull(),
            ]);
    }
}

