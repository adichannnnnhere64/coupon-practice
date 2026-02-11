<?php

namespace App\Filament\Resources\Plans\RelationManagers;

use App\Filament\Resources\PlanInventories\PlanInventoryResource;
use App\Filament\Resources\PlanInventories\Schemas\PlanInventoryForm;
use Filament\Actions\CreateAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class InventoriesRelationManager extends RelationManager
{
    protected static string $relationship = 'inventories';

    /* protected static ?string $relatedResource = PlanInventoryResource::class; */

    public function form(Schema $schema): Schema
    {
        return PlanInventoryForm::configure($schema);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->searchable(),
                TextColumn::make('status')
                ->formatStateUsing(fn ($state) => match ($state) {
                    1 => 'Available',
                    2 => 'Reserved',
                    3 => 'Sold',
                    4 => 'Expired',
                    default => 'Unknown',
                })
                    ->badge()
                ->searchable(),

                TextColumn::make('purchased_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('sold_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('expires_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('deleted_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])->headerActions([
        CreateAction::make(),
            ]);

    }
}
