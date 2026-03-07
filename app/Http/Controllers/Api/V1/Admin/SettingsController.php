<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Cache::get('app_settings', [
            'site_name' => config('app.name'),
            'currency' => 'USD',
            'currency_symbol' => '$',
        ]);

        return response()->json([
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_name' => 'sometimes|string|max:255',
            'currency' => 'sometimes|string|max:3',
            'currency_symbol' => 'sometimes|string|max:5',
        ]);

        $settings = Cache::get('app_settings', []);
        $settings = array_merge($settings, $validated);
        Cache::forever('app_settings', $settings);

        return response()->json([
            'data' => $settings,
            'message' => 'Settings updated successfully',
        ]);
    }

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
            'data' => $settings,
        ]);
    }

    public function updatePrintSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'printer_name' => 'sometimes|string|max:255',
            'paper_size' => 'sometimes|string|in:58mm,80mm,A4',
            'font_size' => 'sometimes|string|max:10',
            'include_qr' => 'sometimes|boolean',
            'include_logo' => 'sometimes|boolean',
            'header_text' => 'sometimes|string|max:255',
            'footer_text' => 'sometimes|string|max:255',
        ]);

        $settings = Cache::get('print_settings', []);
        $settings = array_merge($settings, $validated);
        Cache::forever('print_settings', $settings);

        return response()->json([
            'data' => $settings,
            'message' => 'Print settings updated successfully',
        ]);
    }
}
