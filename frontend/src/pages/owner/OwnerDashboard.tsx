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

  if (loading) return <div>Loading dashboard...</div>;

  if (!restaurant) {
    return (
      <div className="dashboard-card animate-fade-in" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Welcome to Partner Hub</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You don't have a registered restaurant yet. Create one to start receiving orders!</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
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
          <Button type="submit" isLoading={isRegistering} fullWidth>Apply for Registration</Button>
        </form>
      </div>
    );
  }

  if (restaurant.approvalStatus === 'pending') {
    return (
      <div className="dashboard-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem', textAlign: 'center' }}>
        <Clock size={48} color="var(--warning)" />
        <h2>Application Under Review</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Your restaurant <strong>{restaurant.name}</strong> is currently pending approval by our admin team. You will be notified once it is approved.</p>
      </div>
    );
  }
  
  if (restaurant.approvalStatus === 'rejected') {
    return (
      <div className="dashboard-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error)" />
        <h2>Application Rejected</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Unfortunately, your restaurant application was rejected. Please contact support for more details.</p>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{restaurant.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{restaurant.address}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontWeight: 600 }}>Accepting Orders</span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{
              width: 48, height: 24, borderRadius: 12, 
              background: restaurant.isOpen ? 'var(--success)' : '#e5e7eb',
              position: 'relative', transition: 'all 0.3s'
            }} onClick={toggleStatus}>
              <div style={{
                width: 20, height: 20, borderRadius: 10, background: 'white',
                position: 'absolute', top: 2, left: restaurant.isOpen ? 26 : 2,
                transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </div>
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="dashboard-card stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><IndianRupee /></div>
          <div className="stat-info">
            <h4>Today's Revenue</h4>
            <p>₹{revenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="dashboard-card stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><ShoppingBag /></div>
          <div className="stat-info">
            <h4>Today's Orders</h4>
            <p>{todaysOrders.length}</p>
          </div>
        </div>
        
        <div className="dashboard-card stat-card">
          <div className="stat-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}><TrendingUp /></div>
          <div className="stat-info">
            <h4>Total Lifetime Orders</h4>
            <p>{orders.length}</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Recent Activity</h3>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No orders yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Time</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {order.placedAt ? new Date(order.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem' }}>₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      background: order.status === 'delivered' ? '#dcfce7' : '#fef3c7',
                      color: order.status === 'delivered' ? '#16a34a' : '#d97706'
                    }}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
