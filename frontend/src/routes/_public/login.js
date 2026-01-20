import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/routes/_public/login.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
export const Route = createFileRoute('/_public/login')({
    component: () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        console.log('burat');
        const { login } = useAuthStore();
        const navigate = useNavigate();
        const handleSubmit = async (e) => {
            e.preventDefault();
            setError('');
            try {
                await login(email, password);
                navigate({ to: '/dashboard' });
            }
            catch (err) {
                setError(err.response?.data?.message || 'Login failed');
            }
        };
        return (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-3xl font-bold text-center mb-8", children: "Welcome back" }), error && _jsx("div", { className: "alert alert-error mb-6", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Email" }) }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), className: "input input-bordered input-lg", required: true })] }), _jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Password" }) }), _jsx("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), className: "input input-bordered input-lg", required: true })] }), _jsx("button", { type: "submit", className: "btn btn-primary btn-lg w-full", children: "Login" })] }), _jsxs("p", { className: "text-center mt-6", children: ["No account?", ' ', _jsx(Link, { to: "/register", className: "link link-primary", children: "Sign up" })] })] }));
    },
});
