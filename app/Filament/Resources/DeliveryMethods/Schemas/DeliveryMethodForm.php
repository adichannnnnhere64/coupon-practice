<?php

namespace App\Filament\Resources\DeliveryMethod\Schemas;

use App\Models\DeliveryMethod;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class DeliveryMethodForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255)
                    ->helperText('Internal unique name, e.g., "smtp_main"'),
                TextInput::make('display_name')
                    ->required()
                    ->maxLength(255)
                    ->helperText('User-friendly name, e.g., "Email (SMTP)"'),
                Select::make('type')
                    ->options(DeliveryMethod::getTypes())
                    ->required()
                    ->native(false),
KeyValue::make('credentials')
    ->keyLabel('Credential Key')
    ->valueLabel('Credential Value')
    ->addButtonLabel('Add credential')
    ->reorderable()
    ->columnSpanFull()
    ->helperText('Sensitive data – will be encrypted.')
    ->afterStateHydrated(function ($component, $state, $record) {
        // If we have a record, get the casted value directly
        if ($record && $record->exists) {
            $value = $record->getAttributeValue($component->getName());
            if (is_array($value)) {
                $component->state($value);
                return;
            }
        }
        // Fallback: handle raw string
        if (is_string($state)) {
            $decoded = json_decode($state, true);
            $component->state(is_array($decoded) ? $decoded : []);
        } elseif (is_array($state)) {
            $component->state($state);
        } else {
            $component->state([]);
        }
    })
    ->dehydrateStateUsing(function ($state) {
        return is_array($state) ? $state : [];
    }),

KeyValue::make('settings')
    ->keyLabel('Setting Key')
    ->valueLabel('Setting Value')
    ->addButtonLabel('Add setting')
    ->reorderable()
    ->columnSpanFull()
    ->afterStateHydrated(function ($component, $state, $record) {
        if ($record && $record->exists) {
            $value = $record->getAttributeValue($component->getName());
            if (is_array($value)) {
                $component->state($value);
                return;
            }
        }
        if (is_string($state)) {
            $decoded = json_decode($state, true);
            $component->state(is_array($decoded) ? $decoded : []);
        } elseif (is_array($state)) {
            $component->state($state);
        } else {
            $component->state([]);
        }
    })
    ->dehydrateStateUsing(function ($state) {
        return is_array($state) ? $state : [];
    }),
                Toggle::make('is_active')
                    ->default(true)
                    ->required(),
                TextInput::make('retry_attempts')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(10)
                    ->default(3)
                    ->required(),
                TextInput::make('retry_delay_seconds')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(3600)
                    ->default(60)
                    ->required()
                    ->label('Retry Delay (seconds)'),
            ]);
    }
}
