<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    public function printSettings(): JsonResponse
    {
        $settings = Cache::get('print_settings', [
            'printer_name' => 'Thermal Printer',
            'paper_size' => '80mm',
            'font_size' => '12px',
            'include_qr' => true,
            'include_logo' => true,
            'header_text' => 'CouponPay - Recharge Coupon',
            'footer_text' => 'Thank you for your purchase!',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'header_text' => $settings['header_text'] ?? 'CouponPay - Recharge Coupon',
                'footer_text' => $settings['footer_text'] ?? 'Thank you for your purchase!',
                'include_qr' => $settings['include_qr'] ?? true,
                'include_logo' => $settings['include_logo'] ?? true,
                'font_size' => $settings['font_size'] ?? '12px',
                'paper_size' => $settings['paper_size'] ?? '80mm',
            ],
        ]);
    }
}
