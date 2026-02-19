@php
    $media = $record->getFirstMedia('coupon');
@endphp

@if ($media)
    <a href="{{ route('admin.coupons.view', $record) }}"
       target="_blank"
       class="text-blue-600 underline mr-2">
        View
    </a>

    <a href="{{ route('admin.coupons.download', $record) }}"
       class="text-green-600 underline">
        Download
    </a>
@else
    <span class="text-gray-400">No file</span>
@endif

