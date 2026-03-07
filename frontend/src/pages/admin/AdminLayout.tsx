import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '@services/useApi';
import {
  Menu,
  Home,
  Users,
  Smartphone,
  Tag,
  Package,
  FileText,
  Settings,
  Printer,
  Bell,
  LogOut,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const history = useHistory();
  const location = useLocation();
  const { user, logout } = useAuth();
  const headerHeight = 100;

  const menuItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/admin' },
    { name: 'User Management', icon: <Users size={20} />, path: '/admin/users' },
    { name: 'Categories', icon: <Smartphone size={20} />, path: '/admin/categories' },
    { name: 'Plan Types', icon: <Tag size={20} />, path: '/admin/plan-types' },
    { name: 'Plans', icon: <Package size={20} />, path: '/admin/plans' },
    { name: 'Coupons', icon: <Tag size={20} />, path: '/admin/coupons' },
    { name: 'Reports', icon: <FileText size={20} />, path: '/admin/reports' },
    { name: 'Print Settings', icon: <Printer size={20} />, path: '/admin/print-settings' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '15px 30px',
        height: `${headerHeight}px`,
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#333',
              padding: '8px'
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 style={{ margin: 0, color: '#333' }}>Admin Dashboard</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: '8px'
          }}>
            <Bell size={20} color="#666" />
            <span style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#f5576c',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>3</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>{user?.name?.charAt(0).toUpperCase() || 'A'}</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{user?.email || 'admin@coupon.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <LogOut size={20} color="#666" />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: '260px',
            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            height: `calc(100vh - ${headerHeight}px)`,
            padding: '20px 0',
            position: 'fixed',
            left: 0,
            top: `${headerHeight}px`,
            color: 'white'
          }}>
            <div style={{ padding: '0 20px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>🎫</div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>CouponPay</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Admin Panel</div>
                </div>
              </div>
            </div>

            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => history.push(item.path)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  border: 'none',
                  background: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: 'white',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent';
                }}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div style={{
          marginLeft: sidebarOpen ? '260px' : '0',
          padding: '30px',
          width: sidebarOpen ? 'calc(100% - 260px)' : '100%',
          flex: 1,
          overflowY: 'auto',
          transition: 'all 0.3s'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
