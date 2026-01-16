<?php

namespace App\Filament\Resources\PlanAttributes\Schemas;

use App\Models\PlanAttribute;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class PlanAttributeInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('slug'),
                TextEntry::make('type'),
                TextEntry::make('unit')
                    ->placeholder('-'),
                TextEntry::make('description')
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
                    ->visible(fn (PlanAttribute $record): bool => $record->trashed()),
            ]);
    }
}
