import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// src/routes/_authenticated/operator/$id/plan/route.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Outlet, useParams } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/operator/$id/plan')({
    component: () => {
        const { id } = useParams({ from: '/_authenticated/operator/$id/plan' });
        return (_jsx("div", { className: "min-h-screen bg-base-200", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-12", children: [_jsxs("h2", { className: "text-2xl font-bold mb-4", children: ["Plans for Operator ", id] }), _jsx(Outlet, {}), "  "] }) }));
    },
});
