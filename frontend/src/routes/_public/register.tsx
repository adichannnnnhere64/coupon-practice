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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuthStore(); // you'll add this to your store
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: [] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);

        try {
            await register(formData); // this will hit your /api/register endpoint
            // On success → redirect to dashboard or login
            navigate({ to: '/dashboard' });
        } catch (err: any) {
            if (err.response?.status === 422) {
                // Laravel validation error
                const errors = err.response.data.errors || {};
                setFieldErrors(errors);

                // Optional: show general message
                // const messages = Object.values(errors).flat();
                setError('Please check the form for errors');
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-center mb-8">Create your account</h2>

            {error && (
                <div className="alert alert-error mb-6 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Full Name</span>
                    </label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`input
                        input-bordered input-lg ${fieldErrors.name ? 'input-error' : ''}`} required autoFocus />
                    {fieldErrors.name && (
                        <label className="label">
                            <span className="label-text-alt text-error">{fieldErrors.name[0]}</span>
                        </label>
                    )}
                </div>

                {/* Email */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Email</span>
                    </label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input
                        input-bordered input-lg ${fieldErrors.email ? 'input-error' : ''}`} required />
                    {fieldErrors.email && (
                        <label className="label">
                            <span className="label-text-alt text-error">{fieldErrors.email[0]}</span>
                        </label>
                    )}
                </div>

                {/* Phone (optional) */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Phone <span className="text-gray-400">(optional)</span></span>
                    </label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        placeholder="+1234567890" className="input input-bordered input-lg" />
                </div>

                {/* Password */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Password</span>
                    </label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                        className={`input input-bordered input-lg ${fieldErrors.password ? 'input-error' : ''}`}
                        required />
                    {fieldErrors.password && (
                        <label className="label">
                            <span className="label-text-alt text-error">{fieldErrors.password[0]}</span>
                        </label>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Confirm Password</span>
                    </label>
                    <input type="password" name="password_confirmation" value={formData.password_confirmation}
                        onChange={handleChange} className="input input-bordered input-lg" required />
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
                    {isLoading ? (
                        <>
                            <span className="loading loading-spinner"></span>
                            Creating account...
                        </>
                    ) : (
                        'Sign Up'
                    )}
                </button>
            </form>

            <p className="text-center mt-8 text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="link link-primary font-medium">
                    Log in here
                </Link>
            </p>
        </>
    );
}
