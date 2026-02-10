<?php

namespace App\Filament\Resources\PlanInventories;

use App\Filament\Resources\PlanInventories\Pages\CreatePlanInventory;
use App\Filament\Resources\PlanInventories\Pages\EditPlanInventory;
use App\Filament\Resources\PlanInventories\Pages\ListPlanInventories;
use App\Filament\Resources\PlanInventories\Pages\ViewPlanInventory;
use App\Filament\Resources\PlanInventories\Schemas\PlanInventoryForm;
use App\Filament\Resources\PlanInventories\Schemas\PlanInventoryInfolist;
use App\Filament\Resources\PlanInventories\Tables\PlanInventoriesTable;
use App\Models\PlanInventory;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class PlanInventoryResource extends Resource
{
    protected static ?string $model = PlanInventory::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return PlanInventoryForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return PlanInventoryInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PlanInventoriesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPlanInventories::route('/'),
            'create' => CreatePlanInventory::route('/create'),
            'view' => ViewPlanInventory::route('/{record}'),
            'edit' => EditPlanInventory::route('/{record}/edit'),
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
