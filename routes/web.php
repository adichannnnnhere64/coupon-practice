<?php

declare(strict_types=1);
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;


// Web routes disabled - API only application
// Scramble documentation available at /docs/api


Route::get('storage/{path}', function ($path) {
    $file = public_path("storage/$path");

    abort_unless(File::exists($file), 404);

    return response()->file($file);
})->where('path', '.*');

Route::middleware('auth')
    ->get('/coupons/view/{media}', function (\Spatie\MediaLibrary\MediaCollections\Models\Media $media) {
        $inventory = $media->model;

        abort_unless(auth()->id() === $inventory->user_id || auth()->id() === 1, 403);

        $path = $media->getPath();
        $mime = $media->mime_type;

        abort_unless(str_starts_with($mime, 'application/pdf') || str_starts_with($mime, 'image/'), 403);

        return response()->file($path, ['Content-Type' => $mime]);
    })->name('coupons.view');

Route::middleware('auth')
    ->get('/coupons/download/{media}', function (\Spatie\MediaLibrary\MediaCollections\Models\Media $media) {
        $inventory = $media->model;


        abort_unless(auth()->id() === $inventory->user_id || auth()->id() === 1, 403);

        return response()->download($media->getPath(), $media->file_name, ['Content-Type' => $media->mime_type]);
    })->name('coupons.download');


Route::get('/{path?}', function ($path = null) {
    $buildDir = public_path('build');

    // 🔹 If no path is provided, serve index.html
    if (! $path || $path === '/') {
        $indexPath = $buildDir.'/index.html';
        if (File::exists($indexPath)) {
            $content = File::get($indexPath);

            return response($content, 200)
                ->header('Content-Type', 'text/html');
        }

        abort(404, 'index.html not found');
    }

    // 🔹 Clean the path
    $path = mb_ltrim((string) $path, '/');
    $filePath = $buildDir.'/'.$path;

    // 🔹 Serve static assets
    if (File::exists($filePath) && is_file($filePath)) {
        $extension = mb_strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'js' => 'application/javascript',
            'mjs' => 'application/javascript',
            'css' => 'text/css',
            'json' => 'application/json',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject',
            'html' => 'text/html',
        ];

        $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

        $content = File::get($filePath);

        return response($content, 200)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // 🔹 SPA fallback - serve index.html for unknown paths (React Router)
    $indexPath = $buildDir.'/index.html';
    if (File::exists($indexPath)) {
        $content = File::get($indexPath);

        return response($content, 200)
            ->header('Content-Type', 'text/html');
    }

    abort(404, 'File not found');
})->where('path', '.*');

