import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
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

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading menu...</div>;
  if (!restaurantId) return <div className="p-8 text-center text-text-secondary">Please register your restaurant first on the Dashboard.</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Menu Manager</h1>
        <Button onClick={() => openModal()} className="w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus size={18} /> Add New Item
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-left text-text-secondary text-sm">
                <th className="p-4 font-semibold w-24 whitespace-nowrap">Image</th>
                <th className="p-4 font-semibold">Name & Description</th>
                <th className="p-4 font-semibold w-32 whitespace-nowrap">Type</th>
                <th className="p-4 font-semibold w-32 whitespace-nowrap">Price</th>
                <th className="p-4 font-semibold w-40 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {foodItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-secondary">
                    No items in your menu yet. Add some delicious dishes!
                  </td>
                </tr>
              ) : (
                foodItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden shrink-0 border border-border shadow-sm">
                        <img 
                          src={item.imageUrl || '/images/foods/veg-burger.jpg'} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/foods/veg-burger.jpg';
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-text-primary mb-1">{item.name}</div>
                      <div className="text-sm text-text-secondary line-clamp-2">{item.description}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                        item.isVeg ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
                      }`}>
                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-text-primary whitespace-nowrap">₹{item.price}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openModal(item)} className="px-2 h-8">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="px-2 h-8 text-error hover:bg-error-bg hover:text-error">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="menu-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input label="Item Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-primary">Description</label>
                  <textarea 
                    className="w-full p-3 rounded-md border border-gray-300 min-h-[100px] resize-y outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base" 
                    required 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <Input label="Price (₹)" type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-primary">Type</label>
                    <select 
                      className="w-full p-3 rounded-md border border-gray-300 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white text-base h-[48px]" 
                      value={formData.isVeg ? 'true' : 'false'} 
                      onChange={e => setFormData({...formData, isVeg: e.target.value === 'true'})}
                    >
                      <option value="true">Vegetarian</option>
                      <option value="false">Non-Vegetarian</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border flex flex-col sm:flex-row justify-end gap-3 bg-gray-50 rounded-b-xl">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" form="menu-form" className="w-full sm:w-auto">Save Item</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
