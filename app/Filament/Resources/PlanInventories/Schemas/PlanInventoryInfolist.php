<?php

namespace App\Filament\Resources\PlanInventories\Schemas;

use App\Models\PlanInventory;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;

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
                SpatieMediaLibraryFileUpload::make('coupon')
    ->collection('coupon')
    ->disk('private')
    ->maxSize(5120)
    ->columnSpanFull()
    ->afterStateHydrated(function ($component, $state) {
        $media = $component->getState()?->first(); // get the first media

        if ($media) {
            // Set a temporary "preview URL" pointing to your secure route
            $component->previewUrl(route('coupons.download', $media));
        }
    })


            ]);
    }
}
