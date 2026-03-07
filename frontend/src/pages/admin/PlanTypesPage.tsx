import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import adminApiClient, { AdminPlanType, AdminCategory } from '@services/AdminAPIService';
import AdminLayout from './AdminLayout';

const PlanTypesPage: React.FC = () => {
  const [planTypes, setPlanTypes] = useState<AdminPlanType[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlanType, setEditingPlanType] = useState<AdminPlanType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: 0,
    description: '',
    icon: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planTypesRes, categoriesRes] = await Promise.all([
        adminApiClient.getPlanTypes({ per_page: 100 }),
        adminApiClient.getCategories({ per_page: 100 })
      ]);
      setPlanTypes(planTypesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlanType) {
        await adminApiClient.updatePlanType(editingPlanType.id, formData);
      } else {
        await adminApiClient.createPlanType(formData);
      }
      setShowModal(false);
      setEditingPlanType(null);
      setFormData({ name: '', category_id: 0, description: '', icon: '', is_active: true });
      loadData();
    } catch (error) {
      console.error('Failed to save plan type:', error);
    }
  };

  const handleEdit = (planType: AdminPlanType) => {
    setEditingPlanType(planType);
    setFormData({
      name: planType.name,
      category_id: planType.category_id,
      description: planType.description || '',
      icon: planType.icon || '',
      is_active: planType.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (planType: AdminPlanType) => {
    if (window.confirm(`Are you sure you want to delete "${planType.name}"?`)) {
      try {
        await adminApiClient.deletePlanType(planType.id);
        loadData();
      } catch (error) {
        console.error('Failed to delete plan type:', error);
      }
    }
  };

  const openAddModal = () => {
    setEditingPlanType(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || 0,
      description: '',
      icon: '',
      is_active: true
    });
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Plan Types</h2>
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
            Add Plan Type
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {planTypes.map((planType) => (
              <div key={planType.id} style={{
                background: 'white',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>{planType.icon || '📦'}</div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{planType.name}</h3>
                <div style={{ fontSize: '12px', color: '#667eea', marginBottom: '10px' }}>
                  {planType.category?.name || 'No Category'}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
                  {planType.plans_count || 0} Plans
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: planType.is_active ? '#e8f5e9' : '#ffebee',
                  color: planType.is_active ? '#4caf50' : '#f44336'
                }}>
                  {planType.is_active ? 'Active' : 'Inactive'}
                </span>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
                  <button
                    onClick={() => handleEdit(planType)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                  >
                    <Edit2 size={18} color="#667eea" />
                  </button>
                  <button
                    onClick={() => handleDelete(planType)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={18} color="#f44336" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
              maxWidth: '500px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>{editingPlanType ? 'Edit Plan Type' : 'Add Plan Type'}</h3>
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
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
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
                    <option value={0}>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Icon (emoji)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., 📱, 💬, 📶"
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
                  {editingPlanType ? 'Update Plan Type' : 'Create Plan Type'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PlanTypesPage;
