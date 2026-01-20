import { jsx as _jsx } from "react/jsx-runtime";
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createContext, useContext } from 'react';
import MobileLayout from '../layouts/AppLayout';
import { useAuthStore } from '../stores/useAuthStore';
const AuthContext = createContext(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthenticatedProvider');
    }
    return context;
};
export const Route = createFileRoute('/_authenticated')({
    beforeLoad: () => {
        if (!useAuthStore.getState().isAuthenticated) {
            throw redirect({ to: '/login' });
        }
    },
    component: () => {
        const { user, logout } = useAuthStore();
        return (_jsx(MobileLayout, { children: _jsx(AuthContext.Provider, { value: { user: user, logout }, children: _jsx(Outlet, {}) }) }));
    },
});
export function AuthenticatedProvider({ children, user, logout, }) {
    return (_jsx(AuthContext.Provider, { value: { user, logout }, children: children }));
}
