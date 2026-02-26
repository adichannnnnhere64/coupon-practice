<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $title ?? config('app.name') }}</title>
    <style>
        /* Reset styles */
        body, table, td, p, a {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #F9FAFB; /* gray-light */
        }
        table {
            border-collapse: collapse;
            mso-table-lspace: 0;
            mso-table-rspace: 0;
        }
        td {
            vertical-align: top;
        }
        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        /* Header */
        .email-header {
            background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .email-header h1 {
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            line-height: 1.2;
        }
        .email-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin: 8px 0 0;
        }
        /* Body */
        .email-body {
            padding: 32px 24px;
            background-color: #FFFFFF;
        }
        /* Footer */
        .email-footer {
            background-color: #F9FAFB;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        .email-footer p {
            color: #6B7280;
            font-size: 14px;
            margin: 4px 0;
        }
        /* Typography */
        h2 {
            color: #111827;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px;
        }
        p {
            color: #374151;
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 16px;
        }
        /* Button */
        .button {
            display: inline-block;
            background-color: #2563EB;
            color: #FFFFFF;
            font-weight: 600;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 16px 0;
            border: 1px solid #1D4ED8;
        }
        .button:hover {
            background-color: #1D4ED8;
        }
        /* Code block */
        .code-block {
            background-color: #DBEAFE;
            color: #1D4ED8;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 600;
            padding: 12px 16px;
            border-radius: 8px;
            display: inline-block;
            margin: 8px 0;
            border: 1px solid #2563EB;
        }
        /* Info box */
        .info-box {
            background-color: #F9FAFB;
            border-left: 4px solid #2563EB;
            padding: 16px;
            margin: 16px 0;
            border-radius: 4px;
        }
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0;
            }
            .email-header,
            .email-body,
            .email-footer {
                padding: 24px 16px !important;
            }
            .email-header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body style="margin:0; padding:24px; background-color:#F9FAFB;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9FAFB;">
        <tr>
            <td align="center" style="padding:24px 0;">
                <!-- Main Container -->
                <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin:0 auto; background-color:#FFFFFF; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td class="email-header" style="background:linear-gradient(135deg, #2563EB 0%, #6366F1 100%); padding:32px 24px; text-align:center;">
                            <h1 style="color:#FFFFFF; font-size:28px; font-weight:600; margin:0; line-height:1.2;">{{ config('app.name') }}</h1>
                            <p style="color:rgba(255,255,255,0.9); font-size:16px; margin:8px 0 0;">Your trusted partner</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td class="email-body" style="padding:32px 24px; background-color:#FFFFFF;">
                            {{ $slot }}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="email-footer" style="background-color:#F9FAFB; padding:24px; text-align:center; border-top:1px solid #E5E7EB;">
                            <p style="color:#6B7280; font-size:14px; margin:4px 0;">&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
                            <p style="color:#6B7280; font-size:14px; margin:4px 0;">
                                <a href="{{ config('app.url') }}" style="color:#2563EB; text-decoration:none;">Visit our website</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
