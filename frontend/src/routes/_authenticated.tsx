import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createContext, useContext } from 'react';
import MobileLayout from '../layouts/AppLayout';
import { useAuthStore } from '../stores/useAuthStore';

interface AuthContextType {
  user: any;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    return (
      <MobileLayout>
        <AuthContext.Provider value={{ user: user!, logout }}>
          <Outlet />
        </AuthContext.Provider>
      </MobileLayout>
    );
  },
});

export function AuthenticatedProvider({
  children,
  user,
  logout,
}: {
  children: React.ReactNode;
  user: any;
  logout: () => Promise<void>;
}) {
  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
