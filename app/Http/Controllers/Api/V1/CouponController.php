<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PlanInventory;
use Illuminate\Http\Request;

class CouponController extends Controller
{

    public function view(Request $request, PlanInventory $inventory)
{
    $this->authorizeAccess($inventory);

    $media = $inventory->getFirstMedia('coupon');

    // If no media found, return 404
    if (!$media) {
        return response()->json([
            'message' => 'File not available'
        ], 404);
    }

    $mime = $media->mime_type;

    // Check that the MIME type is either PDF or an image
    if (
        !str_starts_with($mime, 'application/pdf') &&
        !str_starts_with($mime, 'image/')
    ) {
        return response()->json([
            'message' => 'Invalid file type'
        ], 403);
    }

    // Return the file
    return response()->file($media->getPath(), [
        'Content-Type' => $mime,
    ]);
}

    public function code(Request $request, PlanInventory $inventory)
    {
        $this->authorizeAccess($inventory);

        if (! $inventory->code) {
            return response()->json([
                'message' => 'Code not available',
            ], 404);
        }

        return response()->json([
            'code' => $inventory->code,
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
