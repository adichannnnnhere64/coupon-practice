import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import adminApiClient, { AdminPlan, AdminPlanType } from '@services/AdminAPIService';
import AdminLayout from './AdminLayout';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [planTypes, setPlanTypes] = useState<AdminPlanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    plan_type_id: 0,
    description: '',
    base_price: 0,
    actual_price: 0,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, planTypesRes] = await Promise.all([
        adminApiClient.getPlans({ page: currentPage, per_page: 15 }),
        adminApiClient.getPlanTypes({ per_page: 100 })
      ]);
      setPlans(plansRes.data);
      setTotalPages(plansRes.last_page);
      setPlanTypes(planTypesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await adminApiClient.updatePlan(editingPlan.id, formData);
      } else {
        await adminApiClient.createPlan(formData);
      }
      setShowModal(false);
      setEditingPlan(null);
      setFormData({ name: '', plan_type_id: 0, description: '', base_price: 0, actual_price: 0, is_active: true });
      loadData();
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleEdit = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      plan_type_id: plan.plan_type_id,
      description: plan.description || '',
      base_price: plan.base_price,
      actual_price: plan.actual_price,
      is_active: plan.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (plan: AdminPlan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      try {
        await adminApiClient.deletePlan(plan.id);
        loadData();
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
  };

  const handleToggleStatus = async (plan: AdminPlan) => {
    try {
      await adminApiClient.togglePlanStatus(plan.id);
      loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const openAddModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      plan_type_id: planTypes[0]?.id || 0,
      description: '',
      base_price: 0,
      actual_price: 0,
      is_active: true
    });
    setShowModal(true);
  };

  const formatPrice = (value: number | string) => {
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
          <h2 style={{ margin: 0, color: '#333' }}>Plans Management</h2>
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
            Add Plan
          </button>
        </div>

        <div style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan Type</th>
                  <th>Plan Name</th>
                  <th>Base Price</th>
                  <th>Actual Price</th>
                  <th>Inventory</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{plan.plan_type?.name || '-'}</div>
                      <div className="admin-table-subtext">{plan.plan_type?.category?.name || '-'}</div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{plan.name}</td>
                    <td style={{ color: '#999' }}>${formatPrice(plan.base_price)}</td>
                    <td style={{ fontWeight: '600', color: '#667eea' }}>${formatPrice(plan.actual_price)}</td>
                    <td>
                      <span style={{ color: '#4caf50', fontWeight: '600' }}>{plan.available_count || 0}</span>
                      <span style={{ color: '#999' }}> / {plan.inventories_count || 0}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: plan.is_active ? '#e8f5e9' : '#ffebee',
                        color: plan.is_active ? '#4caf50' : '#f44336'
                      }}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(plan)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <Edit2 size={16} color="#667eea" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(plan)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          {plan.is_active ? <EyeOff size={16} color="#f44336" /> : <Eye size={16} color="#4caf50" />}
                        </button>
                        <button
                          onClick={() => handleDelete(plan)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={16} color="#f44336" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

        {/* Modal */}
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>{editingPlan ? 'Edit Plan' : 'Add Plan'}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
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
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Plan Type</label>
                  <select
                    value={formData.plan_type_id}
                    onChange={(e) => setFormData({ ...formData, plan_type_id: parseInt(e.target.value) })}
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
                    <option value={0}>Select Plan Type</option>
                    {planTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.category?.name} - {pt.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Base Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                      required
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
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Actual Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.actual_price}
                      onChange={(e) => setFormData({ ...formData, actual_price: parseFloat(e.target.value) || 0 })}
                      required
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
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '600' }}>Active</span>
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
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PlansPage;
