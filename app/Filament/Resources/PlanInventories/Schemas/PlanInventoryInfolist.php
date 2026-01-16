<?php

namespace App\Filament\Resources\PlanInventories\Schemas;

use App\Models\PlanInventory;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class PlanInventoryInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([

                                TextColumn::make('planType.name')
                    ->numeric()
                    ->sortable(),
                TextEntry::make('code'),
                TextEntry::make('status'),
                TextEntry::make('purchased_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('sold_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('expires_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('meta_data')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('deleted_at')
                    ->dateTime()
                    ->visible(fn (PlanInventory $record): bool => $record->trashed()),
            ]);
    }
}
