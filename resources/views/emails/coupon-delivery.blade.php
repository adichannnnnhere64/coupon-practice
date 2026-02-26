<x-mail::layout>
{{-- Header --}}
<x-slot:header>
    <h1 style="color:#FFFFFF; font-size:28px; font-weight:600; margin:0;">Your {{ $planName }}</h1>
</x-slot:header>

{{-- Body --}}
<h2 style="color:#111827; font-size:24px; font-weight:600; margin:0 0 16px;">Hello {{ $user->name }},</h2>

<p style="color:#374151; font-size:16px; line-height:1.5; margin:0 0 16px;">
    Thank you for your purchase! Here are your coupon details:
</p>

<div style="margin:24px 0; text-align:center;">
    <div class="code-block" style="background-color:#DBEAFE; color:#1D4ED8; font-family:'Courier New', monospace; font-size:18px; font-weight:600; padding:12px 16px; border-radius:8px; display:inline-block; border:1px solid #2563EB;">
        {{ $code }}
    </div>
</div>

@if($expiresAt)
<div class="info-box" style="background-color:#F9FAFB; border-left:4px solid #2563EB; padding:16px; margin:16px 0; border-radius:4px;">
    <p style="color:#374151; font-size:16px; margin:0;"><strong>Expires on:</strong> {{ $expiresAt }}</p>
</div>
@endif

@if($viewUrl)
<div style="text-align:center; margin:24px 0;">
    <a href="{{ $viewUrl }}" class="button" style="display:inline-block; background-color:#2563EB; color:#FFFFFF; font-weight:600; text-decoration:none; padding:12px 24px; border-radius:8px; border:1px solid #1D4ED8;">
        View Coupon
    </a>
    <p style="color:#6B7280; font-size:14px; margin:12px 0 0;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="word-break:break-all;">{{ $viewUrl }}</span>
    </p>
</div>
@else
<div class="info-box" style="background-color:#F9FAFB; border-left:4px solid #2563EB; padding:16px; margin:16px 0; border-radius:4px;">
    <p style="color:#374151; font-size:16px; margin:0;">
        No additional media is attached. You can use the code above directly.
    </p>
</div>
@endif

<p style="color:#374151; font-size:16px; line-height:1.5; margin:16px 0 0;">
    Thanks,<br>
    {{ config('app.name') }} Team
</p>

{{-- Footer --}}
<x-slot:footer>
    <p style="color:#6B7280; font-size:14px; margin:4px 0;">
        Need help? <a href="coupon@yahoo.com" style="color:#2563EB; text-decoration:none;">Contact support</a>
    </p>
</x-slot:footer>
</x-mail::layout>
