<?php

namespace Database\Seeders;

use Adichan\Payment\Models\PaymentGateway;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Internal Wallet Gateway
        User::firstOrCreate([
            'name' => 'Admin',
            'email' => 'admin@coupon.com',
            'password' => bcrypt('admincoupon2025!!!@'),
        ]);

        /* $encrypter */
        /* updateOrCreate( */
        /*     ['name' => 'internal'], */
        /*     [ */
        /*         'driver' => 'internal', */
        /*         'is_active' => true, */
        /*         'is_external' => false, */
        /*         'priority' => 1, */
        /*         'config' => [], */
        /*         'meta' => [ */
        /*             'display_name' => 'Wallet Balance', */
        /*             'description' => 'Pay using your wallet balance', */
        /*             'icon' => 'wallet', */
        /*         ], */
        /*     ] */
        /* ); */

    }
}
