import React, { useEffect, useState } from 'react';
import { Users, Activity, DollarSign, TrendingUp } from 'lucide-react';
import adminApiClient, { DashboardStats } from '@services/AdminAPIService';
import AdminLayout from './AdminLayout';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError('');
      const response = await adminApiClient.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError('Failed to load dashboard stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div>Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.total_users || 0, icon: <Users size={32} />, color: '#667eea', change: '+12%' },
    { title: 'Active Users', value: stats?.active_users || 0, icon: <Activity size={32} />, color: '#4caf50', change: '+8%' },
    { title: 'Total Coupons', value: stats?.total_coupons || 0, icon: <DollarSign size={32} />, color: '#f5576c', change: '+15%' },
    { title: 'Available Coupons', value: stats?.available_coupons || 0, icon: <TrendingUp size={32} />, color: '#ffa726', change: '+5%' },
  ];

  return (
    <AdminLayout>
      <div>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Dashboard Overview</h2>
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#ffebee',
            color: '#c62828',
            border: '1px solid #f44336',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {statCards.map((stat, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <div style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: '#e8f5e9',
                  color: '#4caf50',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>{stat.change}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>{stat.title}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
          {/* Quick Stats */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px' }}>Quick Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Categories</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats?.total_categories || 0}</div>
              </div>
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Plan Types</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats?.total_plan_types || 0}</div>
              </div>
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Plans</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats?.total_plans || 0}</div>
              </div>
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Sold Coupons</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats?.sold_coupons || 0}</div>
              </div>
            </div>
          </div>

          {/* Coupon Status */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px' }}>Coupon Status</h3>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Available</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{stats?.available_coupons || 0}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stats?.total_coupons ? (stats.available_coupons / stats.total_coupons) * 100 : 0}%`,
                  height: '100%',
                  background: '#4caf50'
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Sold</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{stats?.sold_coupons || 0}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stats?.total_coupons ? (stats.sold_coupons / stats.total_coupons) * 100 : 0}%`,
                  height: '100%',
                  background: '#f5576c'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
