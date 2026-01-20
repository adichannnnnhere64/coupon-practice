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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        await login(email, password);
        navigate({ to: '/dashboard' });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Login failed');
      }
    };

    return (
      <>
        <h2 className="text-3xl font-bold text-center mb-8">Welcome back</h2>

        {error && <div className="alert alert-error mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input input-bordered input-lg"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input input-bordered input-lg"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full">
            Login
          </button>
        </form>

        <p className="text-center mt-6">
          No account?{' '}
          <Link to="/register" className="link link-primary">
            Sign up
          </Link>
        </p>
      </>
    );
  },
});
