<?php

namespace Database\Factories\Adichan\Transaction\Models;

use Adichan\Transaction\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'status' => 'pending',
            'total' => 0.0,
        ];
    }
}
