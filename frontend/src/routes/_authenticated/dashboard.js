import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/routes/dashboard.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/useAuthStore';
export const Route = createFileRoute('/_authenticated/dashboard')({
    beforeLoad: () => {
        const { isAuthenticated } = useAuthStore.getState();
        console.log(isAuthenticated);
        if (!isAuthenticated) {
            throw redirect({
                to: '/login',
                search: { redirect: '/dashboard' },
            });
        }
    },
    component: () => (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Dashboard" }), _jsx("div", { className: "grid gap-4", children: _jsxs("div", { className: "card bg-base-200 p-6", children: [_jsx("h2", { className: "text-xl", children: "Welcome back!" }), _jsx("p", { children: "You are now in the protected zone." })] }) })] })),
});
