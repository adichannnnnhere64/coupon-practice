// src/routes/_public.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../stores/useAuthStore';

export const Route = createFileRoute('/_public')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },

  component: () => (
    <div>
      <Outlet />
    </div>
  ),
});
