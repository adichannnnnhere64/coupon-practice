import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/layouts/MobileLayout.tsx
import { Link, useMatchRoute, useRouter } from '@tanstack/react-router';
import { Home, User, Settings, LogOut, Store } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
const NAV_ITEMS = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/', icon: Store, label: 'Store' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];
function UserDropdown() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const handleLogout = async () => {
        await logout();
        router.invalidate(); // forces full redirect
    };
    const name = user?.data ? user?.data?.name : user?.name;
    return (_jsxs("div", { className: "dropdown dropdown-end", children: [_jsx("div", { tabIndex: 0, role: "button", className: "btn btn-ghost btn-circle avatar", children: _jsx("div", { className: "w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold", children: name.charAt(0).toUpperCase() }) }), _jsxs("ul", { className: "menu dropdown-content rounded-box z-50 mt-3 w-52 bg-base-100 p-2 shadow", children: [_jsx("li", { children: _jsx(Link, { to: "/", children: "Store" }) }), _jsx("li", { children: _jsx(Link, { to: "/profile", children: "Profile" }) }), _jsx("li", { className: "border-t border-base-300 mt-2 pt-2", children: _jsxs("button", { onClick: handleLogout, className: "text-error flex gap-2", children: [_jsx(LogOut, { className: "w-4" }), " Logout"] }) })] })] }));
}
function CreditIndicator() {
    // Replace with real wallet balance from your backend later
    // const balance = 5000 // TODO: fetch from /api/wallet or user metadata
    const { user } = useAuthStore();
    return (_jsxs("div", { className: "badge badge-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold gap-1 px-4 py-3", children: [_jsx("span", { children: "$" }), _jsx("span", { children: user?.data?.wallet_balance ?? user.wallet_balance ?? 0 })] }));
}
function DockNavItem({ to, icon: Icon, label }) {
    const matchRoute = useMatchRoute();
    const isActive = matchRoute({ to });
    return (_jsxs(Link, { to: to, className: `dock-btn ${isActive ? 'dock-active' : ''}`, "aria-label": label, "aria-current": isActive ? 'page' : undefined, children: [_jsx(Icon, { className: "size-[1.4em]" }), _jsx("span", { className: "dock-label", children: label })] }));
}
function BottomDock() {
    return (_jsx("nav", { className: "dock dock-lg sm:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-50", role: "navigation", children: NAV_ITEMS.map(item => (_jsx(DockNavItem, { ...item }, item.to))) }));
}
export default function MobileLayout({ children }) {
    return (_jsx("div", { className: "min-h-screen bg-base-200 pb-20 md:pb-0", children: _jsxs("div", { className: "flex min-h-screen flex-col bg-base-100 mx-auto max-w-6xl shadow-2xl", children: [_jsx("header", { className: "fixed top-0 left-0 right-0 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300", children: _jsxs("div", { className: "navbar", children: [_jsx("div", { className: "flex-1", children: _jsx(Link, { to: "/dashboard", className: "btn btn-ghost text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent", children: "Swag" }) }), _jsxs("div", { className: "flex-none gap-3", children: [_jsx(CreditIndicator, {}), _jsx(UserDropdown, {})] })] }) }), _jsx("main", { className: "flex-1 overflow-y-auto pt-20 pb-20", children: children }), _jsx(BottomDock, {})] }) }));
}
