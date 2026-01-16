<?php

namespace App\Filament\Resources\PlanAttributes;

use App\Filament\Resources\PlanAttributes\Pages\CreatePlanAttribute;
use App\Filament\Resources\PlanAttributes\Pages\EditPlanAttribute;
use App\Filament\Resources\PlanAttributes\Pages\ListPlanAttributes;
use App\Filament\Resources\PlanAttributes\Pages\ViewPlanAttribute;
use App\Filament\Resources\PlanAttributes\Schemas\PlanAttributeForm;
use App\Filament\Resources\PlanAttributes\Schemas\PlanAttributeInfolist;
use App\Filament\Resources\PlanAttributes\Tables\PlanAttributesTable;
use App\Models\PlanAttribute;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class PlanAttributeResource extends Resource
{
    protected static ?string $model = PlanAttribute::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return PlanAttributeForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return PlanAttributeInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PlanAttributesTable::configure($table);
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
            'index' => ListPlanAttributes::route('/'),
            'create' => CreatePlanAttribute::route('/create'),
            'view' => ViewPlanAttribute::route('/{record}'),
            'edit' => EditPlanAttribute::route('/{record}/edit'),
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
