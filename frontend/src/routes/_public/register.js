import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/routes/_public/register.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore'; // adjust path if needed
export const Route = createFileRoute('/_public/register')({
    component: RegisterPage,
});
function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuthStore(); // you'll add this to your store
    const navigate = useNavigate();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: [] }));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);
        try {
            await register(formData); // this will hit your /api/register endpoint
            // On success → redirect to dashboard or login
            navigate({ to: '/dashboard' });
        }
        catch (err) {
            if (err.response?.status === 422) {
                // Laravel validation error
                const errors = err.response.data.errors || {};
                setFieldErrors(errors);
                // Optional: show general message
                // const messages = Object.values(errors).flat();
                setError('Please check the form for errors');
            }
            else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-3xl font-bold text-center mb-8", children: "Create your account" }), error && (_jsxs("div", { className: "alert alert-error mb-6 shadow-lg", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: error })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Full Name" }) }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, className: `input
                        input-bordered input-lg ${fieldErrors.name ? 'input-error' : ''}`, required: true, autoFocus: true }), fieldErrors.name && (_jsx("label", { className: "label", children: _jsx("span", { className: "label-text-alt text-error", children: fieldErrors.name[0] }) }))] }), _jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Email" }) }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, className: `input
                        input-bordered input-lg ${fieldErrors.email ? 'input-error' : ''}`, required: true }), fieldErrors.email && (_jsx("label", { className: "label", children: _jsx("span", { className: "label-text-alt text-error", children: fieldErrors.email[0] }) }))] }), _jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsxs("span", { className: "label-text", children: ["Phone ", _jsx("span", { className: "text-gray-400", children: "(optional)" })] }) }), _jsx("input", { type: "tel", name: "phone", value: formData.phone, onChange: handleChange, placeholder: "+1234567890", className: "input input-bordered input-lg" })] }), _jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Password" }) }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleChange, className: `input input-bordered input-lg ${fieldErrors.password ? 'input-error' : ''}`, required: true }), fieldErrors.password && (_jsx("label", { className: "label", children: _jsx("span", { className: "label-text-alt text-error", children: fieldErrors.password[0] }) }))] }), _jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Confirm Password" }) }), _jsx("input", { type: "password", name: "password_confirmation", value: formData.password_confirmation, onChange: handleChange, className: "input input-bordered input-lg", required: true })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "btn btn-primary btn-lg w-full", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "loading loading-spinner" }), "Creating account..."] })) : ('Sign Up') })] }), _jsxs("p", { className: "text-center mt-8 text-sm text-gray-600", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "link link-primary font-medium", children: "Log in here" })] })] }));
}
