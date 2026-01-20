import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// routes/success.tsx
import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/success')({
    component: ScamSuccess,
});
function ScamSuccess() {
    return (_jsx("div", { className: "min-h-screen bg-black text-white flex items-center justify-center px-6", children: _jsxs("div", { className: "text-center max-w-4xl", children: [_jsx("h1", { className: "text-6xl sm:text-8xl font-black text-red-600 mb-8 animate-pulse", children: "THANK YOU BITCH!" }), _jsx("h2", { className: "text-4xl sm:text-6xl font-extrabold mb-6 text-green-500", children: "You have been successfully SCAMMED" }), _jsxs("div", { className: "text-2xl sm:text-3xl space-y-4 text-gray-300", children: [_jsx("p", { children: "Your card has been charged." }), _jsx("p", { children: "Your data has been sold." }), _jsx("p", { children: "Your soul now belongs to us." })] }), _jsx("div", { className: "mt-12 text-9xl animate-bounce" }), _jsxs("div", { className: "mt-16", children: [_jsx("p", { className: "text-xl text-red-500 font-bold", children: "There is no refund. There is no escape." }), _jsx("p", { className: "text-gray-500 mt-4", children: "Refresh? Too late. We already have everything." })] }), _jsxs("div", { className: "mt-20 text-sm text-gray-600", children: [_jsx("p", { children: "Need help? Call our support: 1-666-DEVIL-666" }), _jsx("p", { className: "text-xs mt-2", children: "We're not sorry." })] })] }) }));
}
