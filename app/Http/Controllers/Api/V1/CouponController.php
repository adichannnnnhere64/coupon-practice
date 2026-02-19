<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanInventory;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;


class CouponController extends Controller
{
    public function view(Request $request, PlanInventory $inventory)
    {
        $this->authorizeAccess($inventory);

        $media = $inventory->getFirstMedia('coupon');
        abort_unless($media, 404);

        $mime = $media->mime_type;

        abort_unless(
            str_starts_with($mime, 'application/pdf') ||
            str_starts_with($mime, 'image/'),
            403
        );

        return response()->file($media->getPath(), [
            'Content-Type' => $mime,
        ]);
    }

    public function download(Request $request, PlanInventory $inventory)
    {
        $this->authorizeAccess($inventory);

        $media = $inventory->getFirstMedia('coupon');
        abort_unless($media, 404);

        return response()->download(
            $media->getPath(),
            $media->file_name,
            ['Content-Type' => $media->mime_type]
        );
    }

    private function authorizeAccess(PlanInventory $inventory): void
    {
        $user = auth()->user();

        abort_unless(
            $user &&
            ($user->id === $inventory->user_id || $user->id === 1),
            403
        );
    }
}


