// src/layouts/MobileLayout.tsx
import { Link, useMatchRoute, useRouter } from '@tanstack/react-router';
import { Home, User, Settings, LogOut, Store } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/', icon: Store, label: 'Store' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const;

function UserDropdown() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.invalidate(); // forces full redirect
  };

  const name = user?.data ? user?.data?.name : user?.name;

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
      <ul className="menu dropdown-content rounded-box z-50 mt-3 w-52 bg-base-100 p-2 shadow">
        <li>
          <Link to="/">Store</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
        <li className="border-t border-base-300 mt-2 pt-2">
          <button onClick={handleLogout} className="text-error flex gap-2">
            <LogOut className="w-4" /> Logout
          </button>
        </li>
      </ul>
    </div>
  );
}

function CreditIndicator() {
  // Replace with real wallet balance from your backend later
  // const balance = 5000 // TODO: fetch from /api/wallet or user metadata

  const { user } = useAuthStore();

  return (
    <div className="badge badge-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold gap-1 px-4 py-3">
      <span>$</span>
      <span>{user?.data?.wallet_balance ?? user.wallet_balance ?? 0}</span>
    </div>
  );
}

function DockNavItem({ to, icon: Icon, label }: any) {
  const matchRoute = useMatchRoute();
  const isActive = matchRoute({ to });

  return (
    <Link
      to={to}
      className={`dock-btn ${isActive ? 'dock-active' : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="size-[1.4em]" />
      <span className="dock-label">{label}</span>
    </Link>
  );
}

function BottomDock() {
  return (
    <nav
      className="dock dock-lg sm:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
      role="navigation"
    >
      {NAV_ITEMS.map(item => (
        <DockNavItem key={item.to} {...item} />
      ))}
    </nav>
  );
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-base-200 pb-20 md:pb-0">
      <div className="flex min-h-screen flex-col bg-base-100 mx-auto max-w-6xl shadow-2xl">
        <header className="fixed top-0 left-0 right-0 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300">
          <div className="navbar">
            <div className="flex-1">
              <Link
                to="/dashboard"
                className="btn btn-ghost text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                Swag
              </Link>
            </div>
            <div className="flex-none gap-3">
              <CreditIndicator />
              <UserDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-20 pb-20">{children}</main>

        <BottomDock />
      </div>
    </div>
  );
}
