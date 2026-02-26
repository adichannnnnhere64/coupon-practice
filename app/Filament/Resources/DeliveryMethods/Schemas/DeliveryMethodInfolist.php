<?php

namespace App\Filament\Resources\DeliveryMethod\Schemas;

use App\Models\DeliveryMethod;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class DeliveryMethodInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('display_name'),
                TextEntry::make('type')
                    ->formatStateUsing(fn (string $state): string => DeliveryMethod::getTypes()[$state] ?? $state),

                // Fix for credentials: accept mixed and check if array or string
                TextEntry::make('credentials')
                    ->badge()
                    ->formatStateUsing(function ($state): string {
                        // If it's an array, check if not empty
                        if (is_array($state)) {
                            return !empty($state) ? 'Configured' : 'No credentials';
                        }
                        // If it's a string (e.g., encrypted), treat as configured if not empty
                        return !empty($state) ? 'Configured' : 'No credentials';
                    })
                    ->placeholder('No credentials'),

                // Fix for settings
                TextEntry::make('settings')
                    ->badge()
                    ->formatStateUsing(function ($state): string {
                        if (is_array($state)) {
                            $count = count($state);
                            return $count ? $count.' settings' : 'No settings';
                        }
                        return !empty($state) ? 'Settings present' : 'No settings';
                    })
                    ->placeholder('No settings'),

                IconEntry::make('is_active')
                    ->boolean(),
                TextEntry::make('retry_attempts'),
                TextEntry::make('retry_delay_seconds')
                    ->label('Retry Delay (seconds)'),
                TextEntry::make('plans_count')
                    ->label('Used by Plans')
                    ->state(fn (DeliveryMethod $record): int => $record->plans()->count()),
                TextEntry::make('created_at')
                    ->dateTime(),
                TextEntry::make('updated_at')
                    ->dateTime(),
            ]);
    }
}
