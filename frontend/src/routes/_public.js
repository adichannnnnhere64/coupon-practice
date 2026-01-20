import { jsx as _jsx } from "react/jsx-runtime";
// src/routes/_public.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../stores/useAuthStore';
export const Route = createFileRoute('/_public')({
    beforeLoad: () => {
        if (useAuthStore.getState().isAuthenticated) {
            throw redirect({ to: '/dashboard' });
        }
    },
    component: () => (_jsx("div", { children: _jsx(Outlet, {}) })),
});
