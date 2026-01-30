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

  component: () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-4">
        <div className="card bg-base-200 p-6">
          <h2 className="text-xl">Welcome back!</h2>
          <p>You are now in the protected zone.</p>

        </div>
      </div>
    </div>
  ),
});
