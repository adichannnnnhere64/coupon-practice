<?php

namespace App\Filament\Imports;

use App\Models\PlanInventory;
use Filament\Actions\Imports\ImportColumn;
use Filament\Actions\Imports\Importer;
use Filament\Actions\Imports\Models\Import;

class PlanInventoryImporter extends Importer
{
    protected static ?string $model = PlanInventory::class;

    public static function getColumns(): array
    {
        return [
            ImportColumn::make('code')
                ->requiredMapping()
                ->rules(['required', 'string', 'max:255']),

            ImportColumn::make('status')
                ->rules(['nullable', 'integer', 'in:1,2,3,4'])
                ->castStateUsing(function (?string $state): ?int {
                    if (blank($state)) {
                        return PlanInventory::STATUS_AVAILABLE;
                    }

                    // Handle text values
                    $state = strtolower(trim($state));

                    return match ($state) {
                        'available', '1' => PlanInventory::STATUS_AVAILABLE,
                        'reserved', '2' => PlanInventory::STATUS_RESERVED,
                        'sold', '3' => PlanInventory::STATUS_SOLD,
                        'expired', '4' => PlanInventory::STATUS_EXPIRED,
                        default => (int) $state,
                    };
                }),

            ImportColumn::make('expires_at')
                ->rules(['nullable', 'date'])
                ->castStateUsing(function (?string $state): ?\Carbon\Carbon {
                    if (blank($state)) {
                        return null;
                    }

                    return \Carbon\Carbon::parse($state);
                }),

            ImportColumn::make('meta_data')
                ->rules(['nullable'])
                ->castStateUsing(function (?string $state): ?array {
                    if (blank($state)) {
                        return null;
                    }

                    $decoded = json_decode($state, true);

                    return is_array($decoded) ? $decoded : null;
                }),
        ];
    }

    public function resolveRecord(): ?PlanInventory
    {
        // Get plan_id from options passed by ImportAction
        $planId = $this->options['plan_id'] ?? null;

        if (! $planId) {
            return null;
        }

        // Check for duplicates based on code within the same plan
        $existingRecord = PlanInventory::where('plan_id', $planId)
            ->where('code', $this->data['code'])
            ->first();

        if ($existingRecord) {
            // Update existing if duplicate handling is set to update
            if (($this->options['duplicate_handling'] ?? 'skip') === 'update') {
                return $existingRecord;
            }

            // Skip duplicate
            return null;
        }

        // Create new record
        return new PlanInventory([
            'plan_id' => $planId,
        ]);
    }

    public static function getCompletedNotificationBody(Import $import): string
    {
        $body = 'Your inventory import has completed and '.number_format($import->successful_rows).' '.str('row')->plural($import->successful_rows).' imported.';

        if ($failedRowsCount = $import->getFailedRowsCount()) {
            $body .= ' '.number_format($failedRowsCount).' '.str('row')->plural($failedRowsCount).' failed to import.';
        }

        return $body;
    }

    public static function getOptionsFormComponents(): array
    {
        return [
            \Filament\Forms\Components\Select::make('duplicate_handling')
                ->label('When duplicate codes are found')
                ->options([
                    'skip' => 'Skip duplicates',
                    'update' => 'Update existing records',
                ])
                ->default('skip')
                ->native(false),
        ];
    }
}
