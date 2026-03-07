import React, { useEffect, useState } from 'react';
import { Plus, Upload, Search, Edit2, Trash2, X } from 'lucide-react';
import adminApiClient, { AdminInventory, AdminPlan, PaginatedResponse } from '@services/AdminAPIService';
import AdminLayout from './AdminLayout';

const STATUS_MAP: { [key: number]: { label: string; color: string; bg: string } } = {
  1: { label: 'Available', color: '#4caf50', bg: '#e8f5e9' },
  2: { label: 'Sold', color: '#f44336', bg: '#ffebee' },
  3: { label: 'Reserved', color: '#ffa726', bg: '#fff3e0' },
  4: { label: 'Expired', color: '#999', bg: '#f5f5f5' },
};

const CouponsPage: React.FC = () => {
  const [inventory, setInventory] = useState<AdminInventory[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlanId, setFilterPlanId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminInventory | null>(null);
  const [formData, setFormData] = useState({
    plan_id: 0,
    code: '',
    status: 1,
    expires_at: ''
  });
  const [importData, setImportData] = useState({
    plan_id: 0,
    codes: '',
    expires_at: '',
    skip_duplicates: true
  });

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [currentPage, searchTerm, filterPlanId, filterStatus]);

  const loadPlans = async () => {
    try {
      const response = await adminApiClient.getPlans({ per_page: 100 });
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, per_page: 15 };
      if (searchTerm) params.search = searchTerm;
      if (filterPlanId) params.plan_id = filterPlanId;
      if (filterStatus) params.status = filterStatus;

      const response: PaginatedResponse<AdminInventory> = await adminApiClient.getInventory(params);
      setInventory(response.data);
      setTotalPages(response.last_page);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await adminApiClient.updateInventory(editingItem.id, formData);
      } else {
        await adminApiClient.createInventory(formData);
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ plan_id: 0, code: '', status: 1, expires_at: '' });
      loadInventory();
    } catch (error) {
      console.error('Failed to save inventory:', error);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codes = importData.codes
        .split('\n')
        .map(code => code.trim())
        .filter(code => code.length > 0);

      if (codes.length === 0) {
        alert('Please enter at least one coupon code');
        return;
      }

      const result = await adminApiClient.bulkImportInventory({
        plan_id: importData.plan_id,
        codes,
        expires_at: importData.expires_at || undefined,
        skip_duplicates: importData.skip_duplicates
      });

      alert(result.message);
      setShowImportModal(false);
      setImportData({ plan_id: 0, codes: '', expires_at: '', skip_duplicates: true });
      loadInventory();
    } catch (error) {
      console.error('Failed to import:', error);
      alert('Import failed. Please check the data and try again.');
    }
  };

  const handleEdit = (item: AdminInventory) => {
    setEditingItem(item);
    setFormData({
      plan_id: item.plan_id,
      code: item.code,
      status: item.status,
      expires_at: item.expires_at ? item.expires_at.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (item: AdminInventory) => {
    if (window.confirm(`Are you sure you want to delete coupon "${item.code}"?`)) {
      try {
        await adminApiClient.deleteInventory(item.id);
        loadInventory();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ plan_id: plans[0]?.id || 0, code: '', status: 1, expires_at: '' });
    setShowModal(true);
  };

  const openImportModal = () => {
    setImportData({ plan_id: plans[0]?.id || 0, codes: '', expires_at: '', skip_duplicates: true });
    setShowImportModal(true);
  };

  const formatPrice = (value: number | string | null | undefined) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
      return '0.00';
    }
    return numericValue.toFixed(2);
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Coupon Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openImportModal}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Upload size={18} />
              Bulk Import
            </button>
            <button
              onClick={openAddModal}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} />
              Add Coupon
            </button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input
                type="text"
                placeholder="Search coupon codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={filterPlanId}
              onChange={(e) => setFilterPlanId(e.target.value ? parseInt(e.target.value) : '')}
              style={{
                padding: '10px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666',
                minWidth: '200px'
              }}
            >
              <option value="">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value ? parseInt(e.target.value) : '')}
              style={{
                padding: '10px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666',
                minWidth: '150px'
              }}
            >
              <option value="">All Status</option>
              <option value="1">Available</option>
              <option value="2">Sold</option>
              <option value="3">Reserved</option>
              <option value="4">Expired</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const status = STATUS_MAP[item.status] || STATUS_MAP[1];
                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {item.code}
                      </td>
                      <td>
                        <div>{item.plan?.name || '-'}</div>
                        <div className="admin-table-subtext">{item.plan?.plan_type?.name || '-'}</div>
                      </td>
                      <td style={{ fontWeight: '600', color: '#667eea' }}>
                        ${formatPrice(item.plan?.actual_price)}
                      </td>
                      <td>
                        {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: status.bg,
                          color: status.color
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit2 size={16} color="#ffa726" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={16} color="#f44336" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    background: currentPage === page ? '#667eea' : 'white',
                    color: currentPage === page ? 'white' : '#667eea',
                    border: '1px solid #667eea',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              width: '100%',
              maxWidth: '500px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>{editingItem ? 'Edit Coupon' : 'Add Coupon'}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Plan</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: parseInt(e.target.value) })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={0}>Select Plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Coupon Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={1}>Available</option>
                    <option value={2}>Sold</option>
                    <option value={3}>Reserved</option>
                    <option value={4}>Expired</option>
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  {editingItem ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              width: '100%',
              maxWidth: '600px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Bulk Import Coupons</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleImport}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Plan</label>
                  <select
                    value={importData.plan_id}
                    onChange={(e) => setImportData({ ...importData, plan_id: parseInt(e.target.value) })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={0}>Select Plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Coupon Codes (one per line)
                  </label>
                  <textarea
                    value={importData.codes}
                    onChange={(e) => setImportData({ ...importData, codes: e.target.value })}
                    required
                    rows={10}
                    placeholder="ABC123456789&#10;XYZ987654321&#10;DEF456789123"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={importData.expires_at}
                    onChange={(e) => setImportData({ ...importData, expires_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={importData.skip_duplicates}
                      onChange={(e) => setImportData({ ...importData, skip_duplicates: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '600' }}>Skip duplicate codes</span>
                  </label>
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}
                >
                  Import Coupons
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CouponsPage;
