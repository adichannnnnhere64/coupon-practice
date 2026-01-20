import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Outlet, ScrollRestoration, createRootRouteWithContext, } from '@tanstack/react-router';
import '../App.css';
import { useAuthStore } from '../stores/useAuthStore';
export const Route = createRootRouteWithContext()({
    component: RootComponent,
});
function RootComponent() {
    return (_jsxs(React.Fragment, { children: [_jsx(ScrollRestoration, {}), _jsx(Outlet, {})] }));
}
