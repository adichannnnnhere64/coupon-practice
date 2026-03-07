import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import adminApiClient from '@services/AdminAPIService';
import AdminLayout from './AdminLayout';

type ReportTab = 'sales' | 'users' | 'wallet' | 'revenue';

const ReportsPage: React.FC = () => {
  const [reportTab, setReportTab] = useState<ReportTab>('sales');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadData();
  }, [reportTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      switch (reportTab) {
        case 'sales':
          const salesRes = await adminApiClient.getSalesReport(params);
          setData(salesRes.data);
          break;
        case 'users':
          const usersRes = await adminApiClient.getUserReport(params);
          setData(usersRes.data);
          break;
        case 'wallet':
          const walletRes = await adminApiClient.getWalletTransactions(params);
          setData(walletRes.data);
          break;
        case 'revenue':
          const revenueRes = await adminApiClient.getRevenueReport(params);
          setRevenueData(revenueRes.data);
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    loadData();
  };

  const tabs = [
    { id: 'sales' as ReportTab, name: 'Sales Report' },
    { id: 'users' as ReportTab, name: 'User Report' },
    { id: 'wallet' as ReportTab, name: 'Wallet Transactions' },
    { id: 'revenue' as ReportTab, name: 'Revenue Report' },
  ];

  return (
    <AdminLayout>
      <div>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Reports & Analytics</h2>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: reportTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: reportTab === tab.id ? 'white' : '#667eea',
                border: reportTab === tab.id ? 'none' : '2px solid #667eea',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: '8px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px' }}
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: '8px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px' }}
              />
              <button
                onClick={handleApplyFilter}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                Apply
              </button>
            </div>
            <button style={{
              padding: '8px 16px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '13px'
            }}>
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : (
            <>
              {reportTab === 'sales' && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((sale: any) => (
                      <tr key={sale.id}>
                        <td>
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {sale.user?.name || '-'}
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>
                          #{sale.id}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: sale.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                            color: sale.status === 'completed' ? '#4caf50' : '#ffa726'
                          }}>
                            {sale.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#667eea' }}>
                          ${parseFloat(sale.total_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {reportTab === 'users' && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Orders</th>
                      <th style={{ textAlign: 'right' }}>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((user: any) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: '600' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.orders_count || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#667eea' }}>
                          ${parseFloat(user.orders_sum_total_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {reportTab === 'wallet' && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((txn: any) => (
                      <tr key={txn.id}>
                        <td>
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {txn.wallet?.user?.name || '-'}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: txn.type === 'credit' ? '#e8f5e9' : '#fff3e0',
                            color: txn.type === 'credit' ? '#4caf50' : '#ffa726'
                          }}>
                            {txn.type}
                          </span>
                        </td>
                        <td style={{
                          textAlign: 'right',
                          fontWeight: '600',
                          color: txn.type === 'credit' ? '#4caf50' : '#f44336'
                        }}>
                          {txn.type === 'credit' ? '+' : '-'}${parseFloat(txn.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          ${parseFloat(txn.balance_after || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {reportTab === 'revenue' && revenueData && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Revenue</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
                        ${parseFloat(revenueData.total_revenue || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Orders</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
                        {revenueData.total_orders || 0}
                      </div>
                    </div>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Average Order Value</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffa726' }}>
                        ${revenueData.total_orders > 0 ? (parseFloat(revenueData.total_revenue) / revenueData.total_orders).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>

                  <h4 style={{ marginBottom: '15px' }}>Daily Revenue</h4>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(revenueData.daily_revenue || []).map((day: any, idx: number) => (
                        <tr key={idx}>
                          <td>{day.date}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600', color: '#667eea' }}>
                            ${parseFloat(day.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {(revenueData.daily_revenue || []).length === 0 && (
                        <tr>
                          <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
