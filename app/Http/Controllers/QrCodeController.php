<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeController extends Controller
{
    public function generate(string $code): Response
    {
        $qrCode = QrCode::format('png')
            ->size(200)
            ->margin(1)
            ->generate($code);

        return response($qrCode, 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
