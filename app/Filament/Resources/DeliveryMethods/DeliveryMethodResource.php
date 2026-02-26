<?php

namespace App\Filament\Resources\DeliveryMethods;

use App\Filament\Resources\DeliveryMethod\Pages;
use App\Filament\Resources\DeliveryMethod\Schemas\DeliveryMethodForm;
use App\Filament\Resources\DeliveryMethod\Schemas\DeliveryMethodInfolist;
use App\Filament\Resources\DeliveryMethod\Tables\DeliveryMethodsTable;
use App\Models\DeliveryMethod;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DeliveryMethodResource extends Resource
{
    protected static ?string $model = DeliveryMethod::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTruck;

    protected static ?string $navigationLabel = 'Delivery Methods';

    protected static ?int $navigationSort = 5;

    protected static ?string $recordTitleAttribute = 'display_name';

    public static function form(Schema $schema): Schema
    {
        return DeliveryMethodForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return DeliveryMethodInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DeliveryMethodsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            // Optionally add a relation manager for plans later
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDeliveryMethods::route('/'),
            'create' => Pages\CreateDeliveryMethod::route('/create'),
            'view' => Pages\ViewDeliveryMethod::route('/{record}'),
            'edit' => Pages\EditDeliveryMethod::route('/{record}/edit'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
