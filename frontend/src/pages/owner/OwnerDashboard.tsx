import React, { useState, useEffect } from 'react';
import { IndianRupee, ShoppingBag, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  isOpen: boolean;
  approvalStatus: string;
}

interface Order {
  id: string;
  status: string;
  placedAt: string;
  totalAmount: number | string;
}

export const OwnerDashboard = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', address: '', cuisineType: '', city: '', phone: '', pinCode: '' 
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resData = await api.get('/restaurants/my');
      const rest = resData.data.data[0]; // Owner can have multiple, we take first
      setRestaurant(rest || null);
      
      if (rest) {
        const orderData = await api.get(`/orders/restaurant/${rest.id}`);
        console.log("Dashboard API:", orderData.data);
        setOrders(orderData.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsRegistering(true);
      const payload = { ...formData };
      if (payload.phone && !payload.phone.startsWith('+91')) {
        payload.phone = '+91' + payload.phone.replace(/^0+/, '');
      }
      await api.post('/restaurants', payload);
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Failed to register restaurant');
      } else {
        alert('Failed to register restaurant');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleStatus = async () => {
    if (!restaurant) return;
    try {
      await api.patch(`/restaurants/${restaurant.id}/toggle`);
      setRestaurant({ ...restaurant, isOpen: !restaurant.isOpen });
    } catch {
      alert('Failed to toggle status');
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading dashboard...</div>;

  if (!restaurant) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-8 md:p-12 text-center max-w-lg mx-auto animate-fade-in mt-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to Partner Hub</h2>
        <p className="text-text-secondary mb-8">You don't have a registered restaurant yet. Create one to start receiving orders!</p>
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4 text-left">
          <Input 
            label="Restaurant Name" 
            placeholder="e.g. Spice Garden" 
            required 
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <Input 
            label="Full Address" 
            placeholder="123 Main St, City" 
            required 
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
          <Input 
            label="City" 
            placeholder="e.g. Bengaluru" 
            required 
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
          />
          <Input 
            label="PIN Code" 
            placeholder="e.g. 560001" 
            required 
            value={formData.pinCode}
            onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
          />
          <Input 
            label="Cuisine Type" 
            placeholder="e.g. North Indian" 
            required 
            value={formData.cuisineType}
            onChange={e => setFormData({ ...formData, cuisineType: e.target.value })}
          />
          <Input 
            label="Phone Number" 
            placeholder="e.g. +919876543210" 
            required 
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
          <Button type="submit" isLoading={isRegistering} fullWidth className="mt-4">Apply for Registration</Button>
        </form>
      </div>
    );
  }

  if (restaurant.approvalStatus === 'pending') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-8 md:p-16 flex flex-col items-center gap-4 text-center animate-fade-in mt-8">
        <Clock size={48} className="text-warning" />
        <h2 className="text-2xl font-bold text-text-primary">Application Under Review</h2>
        <p className="text-text-secondary max-w-md">Your restaurant <strong className="text-text-primary">{restaurant.name}</strong> is currently pending approval by our admin team. You will be notified once it is approved.</p>
      </div>
    );
  }
  
  if (restaurant.approvalStatus === 'rejected') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-8 md:p-16 flex flex-col items-center gap-4 text-center animate-fade-in mt-8">
        <AlertCircle size={48} className="text-error" />
        <h2 className="text-2xl font-bold text-text-primary">Application Rejected</h2>
        <p className="text-text-secondary max-w-md">Unfortunately, your restaurant application was rejected. Please contact support for more details.</p>
      </div>
    );
  }

  // Calculate Stats
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => o.placedAt && new Date(o.placedAt).toDateString() === today);
  const revenue = todaysOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">{restaurant.name}</h1>
          <p className="text-text-secondary">{restaurant.address}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-border shadow-sm">
          <span className="font-semibold text-text-primary text-sm md:text-base">Accepting Orders</span>
          <label className="flex items-center cursor-pointer">
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${restaurant.isOpen ? 'bg-success' : 'bg-gray-200'}`} onClick={toggleStatus}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md ${restaurant.isOpen ? 'left-[26px]' : 'left-0.5'}`} />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <IndianRupee size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-1">Today's Revenue</h4>
            <p className="text-2xl font-bold text-text-primary">₹{revenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-1">Today's Orders</h4>
            <p className="text-2xl font-bold text-text-primary">{todaysOrders.length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-1">Total Lifetime Orders</h4>
            <p className="text-2xl font-bold text-text-primary">{orders.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary m-0">Recent Activity</h3>
        </div>
        {orders.length === 0 ? (
          <div className="p-6 text-text-secondary">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-left text-text-secondary text-sm">
                  <th className="p-4 font-semibold whitespace-nowrap">Order ID</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Time</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-text-primary whitespace-nowrap">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4 text-text-secondary whitespace-nowrap">
                      {order.placedAt ? new Date(order.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                    </td>
                    <td className="p-4 font-medium text-text-primary whitespace-nowrap">₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                        order.status === 'delivered' ? 'bg-success-bg text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
