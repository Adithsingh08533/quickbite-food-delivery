import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  imageUrl?: string;
}

export const MenuManager = () => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [foodItems, setFoodItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isVeg: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resData = await api.get('/restaurants/my');
      const rest = resData.data.data[0];
      if (rest) {
        setRestaurantId(rest.id);
        const foodData = await api.get(`/restaurants/${rest.id}/food-items`);
        setFoodItems(foodData.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch menu', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        isVeg: item.isVeg,
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', isVeg: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingItem) {
        await api.patch(`/restaurants/${restaurantId}/food-items/${editingItem.id}`, payload);
      } else {
        await api.post(`/restaurants/${restaurantId}/food-items`, payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Failed to save food item');
      } else {
        alert('Failed to save food item');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/restaurants/${restaurantId}/food-items/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  if (loading) return <div>Loading menu...</div>;
  if (!restaurantId) return <div className="dashboard-card">Please register your restaurant first on the Dashboard.</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Menu Manager</h1>
        <Button onClick={() => openModal()}><Plus size={18} /> Add New Item</Button>
      </div>

      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem', width: 80 }}>Image</th>
              <th style={{ padding: '1rem 1.5rem' }}>Name & Description</th>
              <th style={{ padding: '1rem 1.5rem', width: 100 }}>Type</th>
              <th style={{ padding: '1rem 1.5rem', width: 120 }}>Price</th>
              <th style={{ padding: '1rem 1.5rem', width: 150, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No items in your menu yet. Add some delicious dishes!
                </td>
              </tr>
            ) : (
              foodItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', overflow: 'hidden' }}>
                      <img 
                        src={item.imageUrl || '/images/foods/veg-burger.jpg'} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/foods/veg-burger.jpg';
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      background: item.isVeg ? '#dcfce7' : '#fee2e2',
                      color: item.isVeg ? '#16a34a' : '#ef4444'
                    }}>
                      {item.isVeg ? 'VEG' : 'NON-VEG'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>₹{item.price}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => openModal(item)}><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="dashboard-card animate-slide-up" style={{ width: '100%', maxWidth: 500, padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Item Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="input-label">Description</label>
                <textarea 
                  className="input-field" 
                  style={{ height: 'auto', padding: '12px', resize: 'vertical', minHeight: 80 }} 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <Input label="Price (₹)" type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="input-label">Type</label>
                  <select className="input-field" value={formData.isVeg ? 'true' : 'false'} onChange={e => setFormData({...formData, isVeg: e.target.value === 'true'})}>
                    <option value="true">Vegetarian</option>
                    <option value="false">Non-Vegetarian</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button type="button" variant="outline" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" fullWidth>Save Item</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
