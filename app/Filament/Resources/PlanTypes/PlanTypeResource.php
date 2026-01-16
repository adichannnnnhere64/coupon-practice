<?php

namespace App\Filament\Resources\PlanTypes;

use App\Filament\Resources\PlanTypes\Pages\CreatePlanType;
use App\Filament\Resources\PlanTypes\Pages\EditPlanType;
use App\Filament\Resources\PlanTypes\Pages\ListPlanTypes;
use App\Filament\Resources\PlanTypes\Pages\ViewPlanType;
use App\Filament\Resources\PlanTypes\Schemas\PlanTypeForm;
use App\Filament\Resources\PlanTypes\Schemas\PlanTypeInfolist;
use App\Filament\Resources\PlanTypes\Tables\PlanTypesTable;
use App\Models\PlanType;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class PlanTypeResource extends Resource
{
    protected static ?string $model = PlanType::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return PlanTypeForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return PlanTypeInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PlanTypesTable::configure($table);
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
            'index' => ListPlanTypes::route('/'),
            'create' => CreatePlanType::route('/create'),
            'view' => ViewPlanType::route('/{record}'),
            'edit' => EditPlanType::route('/{record}/edit'),
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
