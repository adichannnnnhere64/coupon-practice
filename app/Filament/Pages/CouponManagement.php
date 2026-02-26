<?php

namespace App\Filament\Pages;

use App\Filament\Imports\PlanInventoryImporter;
use App\Models\Category;
use App\Models\Plan;
use App\Models\PlanInventory;
use App\Models\PlanType;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Actions\ImportAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Livewire\Attributes\Url;

class CouponManagement extends Page implements HasForms, HasTable
{
    use InteractsWithForms;
    use InteractsWithTable;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSquare3Stack3d;

    protected static ?string $navigationLabel = 'Coupon Manager';

    protected static ?string $title = 'Unified Coupon Manager';

    protected static ?int $navigationSort = 1;

    protected string $view = 'filament.pages.coupon-management';

    #[Url]
    public ?int $selectedCategoryId = null;

    #[Url]
    public ?int $selectedPlanTypeId = null;

    public array $expandedCategories = [];

    public function mount(): void
    {
        if ($this->selectedCategoryId) {
            $this->expandedCategories[$this->selectedCategoryId] = true;
        }
    }

    public function getCategories()
    {
        return Category::with(['planTypes' => function ($query) {
            $query->withCount('plans');
        }])
            ->withCount('planTypes')
            ->orderBy('name')
            ->get();
    }

    public function selectCategory(int $categoryId): void
    {
        if ($this->selectedCategoryId === $categoryId) {
            $this->expandedCategories[$categoryId] = ! ($this->expandedCategories[$categoryId] ?? false);
        } else {
            $this->selectedCategoryId = $categoryId;
            $this->expandedCategories[$categoryId] = true;
            $this->selectedPlanTypeId = null;
        }
    }

    public function selectPlanType(int $planTypeId): void
    {
        $this->selectedPlanTypeId = $planTypeId;
        $planType = PlanType::find($planTypeId);
        if ($planType) {
            $categoryId = $planType->categories()->first()?->id;
            if ($categoryId) {
                $this->selectedCategoryId = $categoryId;
                $this->expandedCategories[$categoryId] = true;
            }
        }
    }

    public function getSelectedPlanType(): ?PlanType
    {
        return $this->selectedPlanTypeId ? PlanType::find($this->selectedPlanTypeId) : null;
    }

    public function getSelectedCategory(): ?Category
    {
        return $this->selectedCategoryId ? Category::find($this->selectedCategoryId) : null;
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Plan::query()
                    ->when(
                        $this->selectedPlanTypeId,
                        fn ($query) => $query->where('plan_type_id', $this->selectedPlanTypeId)
                    )
                    ->when(
                        ! $this->selectedPlanTypeId && $this->selectedCategoryId,
                        fn ($query) => $query->whereHas(
                            'planType.categories',
                            fn ($q) => $q->where('categories.id', $this->selectedCategoryId)
                        )
                    )
                    ->when(
                        ! $this->selectedPlanTypeId && ! $this->selectedCategoryId,
                        fn ($query) => $query->whereRaw('1 = 0')
                    )
                    ->withCount([
                        'inventories as available_stock' => fn ($q) => $q->where('status', PlanInventory::STATUS_AVAILABLE),
                        'inventories as total_stock',
                    ])
            )
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('planType.name')
                    ->label('Plan Type')
                    ->sortable(),
                TextColumn::make('base_price')
                    ->label('Base Price')
                    ->money('USD')
                    ->sortable(),
                TextColumn::make('actual_price')
                    ->label('Actual Price')
                    ->money('USD')
                    ->sortable(),
                TextColumn::make('available_stock')
                    ->label('Stock')
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state <= 0 => 'danger',
                        $state <= 10 => 'warning',
                        default => 'success',
                    }),
                TextColumn::make('is_active')
                    ->label('Active')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state ? 'Yes' : 'No')
                    ->color(fn ($state) => $state ? 'success' : 'gray'),
            ])
            ->recordActions([
                EditAction::make()
                    ->url(fn (Plan $record): string => route('filament.admin.resources.plans.edit', ['record' => $record])),
                Action::make('inventory')
                    ->label('Inventory')
                    ->icon(Heroicon::OutlinedArchiveBox)
                    ->modalHeading(fn (Plan $record) => "Inventory for {$record->name}")
                    ->modalDescription(fn (Plan $record) => "Available: {$record->available_stock} / Total: {$record->total_stock}")
                    ->modalWidth('xl')
                    ->form([
                        Repeater::make('codes')
                            ->label('Add Inventory Codes')
                            ->schema([
                                TextInput::make('code')
                                    ->required()
                                    ->placeholder('Enter coupon code'),
                                Select::make('status')
                                    ->options([
                                        PlanInventory::STATUS_AVAILABLE => 'Available',
                                        PlanInventory::STATUS_RESERVED => 'Reserved',
                                        PlanInventory::STATUS_SOLD => 'Sold',
                                        PlanInventory::STATUS_EXPIRED => 'Expired',
                                    ])
                                    ->default(PlanInventory::STATUS_AVAILABLE),
                                DateTimePicker::make('expires_at')
                                    ->label('Expires At')
                                    ->native(false),
                            ])
                            ->columns(3)
                            ->defaultItems(1)
                            ->addActionLabel('Add Another Code')
                            ->reorderable(false),
                    ])
                    ->action(function (array $data, Plan $record): void {
                        $codes = $data['codes'] ?? [];
                        $created = 0;

                        foreach ($codes as $codeData) {
                            if (! empty($codeData['code'])) {
                                PlanInventory::create([
                                    'plan_id' => $record->id,
                                    'code' => $codeData['code'],
                                    'status' => $codeData['status'] ?? PlanInventory::STATUS_AVAILABLE,
                                    'expires_at' => $codeData['expires_at'] ?? null,
                                ]);
                                $created++;
                            }
                        }

                        if ($created > 0) {
                            Notification::make()
                                ->title("{$created} inventory code(s) added")
                                ->success()
                                ->send();
                        }
                    })
                    ->modalSubmitActionLabel('Add Codes')
                    ->modalCancelActionLabel('Close'),
                DeleteAction::make()
                    ->requiresConfirmation(),
            ])
            ->headerActions([
                CreateAction::make()
                    ->model(Plan::class)
                    ->label('New Plan')
                    ->form([
                        Select::make('plan_type_id')
                            ->label('Plan Type')
                            ->options(fn () => $this->getPlanTypeOptions())
                            ->default($this->selectedPlanTypeId)
                            ->required()
                            ->searchable()
                            ->preload(),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('base_price')
                            ->required()
                            ->numeric()
                            ->prefix('$'),
                        TextInput::make('actual_price')
                            ->required()
                            ->numeric()
                            ->prefix('$'),
                        Textarea::make('description')
                            ->rows(3),
                        Toggle::make('is_active')
                            ->default(true),
                        Toggle::make('inventory_enabled')
                            ->default(true),
                    ])
                    ->successNotificationTitle('Plan created successfully'),
            ])
            ->emptyStateHeading(
                fn () => $this->selectedPlanTypeId || $this->selectedCategoryId
                    ? 'No plans found'
                    : 'Select a category or plan type'
            )
            ->emptyStateDescription(
                fn () => $this->selectedPlanTypeId || $this->selectedCategoryId
                    ? 'Create your first plan using the button above.'
                    : 'Use the sidebar to select a category or plan type to view its plans.'
            );
    }

    protected function getPlanTypeOptions(): array
    {
        if ($this->selectedPlanTypeId) {
            return PlanType::where('id', $this->selectedPlanTypeId)->pluck('name', 'id')->toArray();
        }

        if ($this->selectedCategoryId) {
            $category = Category::find($this->selectedCategoryId);

            return $category?->planTypes()->pluck('name', 'id')->toArray() ?? [];
        }

        return PlanType::pluck('name', 'id')->toArray();
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('createCategory')
                ->label('New Category')
                ->icon(Heroicon::OutlinedFolderPlus)
                ->form([
                    TextInput::make('name')
                        ->required()
                        ->maxLength(255),
                    TextInput::make('slug')
                        ->required()
                        ->maxLength(255),
                    Textarea::make('description')
                        ->rows(2),
                    Toggle::make('is_active')
                        ->default(true),
                ])
                ->action(function (array $data): void {
                    Category::create($data);
                    Notification::make()
                        ->title('Category created')
                        ->success()
                        ->send();
                }),

            Action::make('createPlanType')
                ->label('New Plan Type')
                ->icon(Heroicon::OutlinedTag)
                ->form([
                    Select::make('categories')
                        ->label('Categories')
                        ->multiple()
                        ->options(Category::pluck('name', 'id'))
                        ->default(fn () => $this->selectedCategoryId ? [$this->selectedCategoryId] : [])
                        ->searchable(),
                    TextInput::make('name')
                        ->required()
                        ->maxLength(255),
                    TextInput::make('slug')
                        ->required()
                        ->maxLength(255),
                    Textarea::make('description')
                        ->rows(2),
                    Toggle::make('is_active')
                        ->default(true),
                ])
                ->action(function (array $data): void {
                    $categories = $data['categories'] ?? [];
                    unset($data['categories']);

                    $planType = PlanType::create($data);
                    if (! empty($categories)) {
                        $planType->categories()->attach($categories);
                    }

                    Notification::make()
                        ->title('Plan Type created')
                        ->success()
                        ->send();
                }),

            ImportAction::make()
                ->label('Import Inventory')
                ->icon(Heroicon::OutlinedArrowUpTray)
                ->importer(PlanInventoryImporter::class)
                ->form([
                    Select::make('plan_id')
                        ->label('Import to Plan')
                        ->options(fn () => $this->getImportPlanOptions())
                        ->searchable()
                        ->required(),
                ])
                ->options(fn (array $data): array => [
                    'plan_id' => $data['plan_id'] ?? null,
                ]),
        ];
    }

    protected function getImportPlanOptions(): array
    {
        $query = Plan::query();

        if ($this->selectedPlanTypeId) {
            $query->where('plan_type_id', $this->selectedPlanTypeId);
        } elseif ($this->selectedCategoryId) {
            $query->whereHas(
                'planType.categories',
                fn ($q) => $q->where('categories.id', $this->selectedCategoryId)
            );
        }

        return $query->pluck('name', 'id')->toArray();
    }
}
