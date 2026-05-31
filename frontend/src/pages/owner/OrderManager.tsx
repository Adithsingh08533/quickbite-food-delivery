import { useState, useEffect, useRef } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';
import { Button } from '../../components/ui/Button';

interface OrderItem {
  id: string;
  foodName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface Order {
  id: string;
  status: string;
  placedAt: string;
  totalAmount: number;
  items: OrderItem[];
}

export const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const resData = await api.get('/restaurants/my');
      const rest = resData.data.data[0];
      if (rest) {
        // Bypass caching
        const orderData = await api.get(`/orders/restaurant/${rest.id}?t=${Date.now()}`);
        setOrders(orderData.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder: Order) => {
      setOrders(prevOrders => {
        // Prevent duplicates if already fetched
        if (prevOrders.some(o => o.id === newOrder.id)) return prevOrders;
        return [newOrder, ...prevOrders];
      });
    };

    const handleStatusUpdate = (updatedOrder: Order) => {
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o)
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [socket]);

  const isUpdatingRef = useRef(false);

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (updatingOrderId || isUpdatingRef.current) return; // Prevent double clicks synchronously
    
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || targetOrder.status === newStatus) return; // Prevent API calls when target status equals current status

    isUpdatingRef.current = true;
    
    // Optimistic UI update
    const previousOrders = [...orders];
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    );

    try {
      setUpdatingOrderId(orderId);
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err: unknown) {
      // Revert on error
      setOrders(previousOrders);
      const axiosErr = err as { response?: { data?: { error?: string } }, message?: string };
      alert(axiosErr.response?.data?.error || axiosErr.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
      isUpdatingRef.current = false;
    }
  };

  const getNextStatusAction = (currentStatus: string, id: string) => {
    const isUpdating = updatingOrderId === id;
    
    switch (currentStatus) {
      case 'pending':
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="sm" onClick={() => updateStatus(id, 'accepted')} style={{ flex: 1 }} disabled={isUpdating} isLoading={isUpdating}>Accept</Button>
            <Button size="sm" variant="danger" onClick={() => updateStatus(id, 'cancelled')} style={{ flex: 1 }} disabled={isUpdating}>Reject</Button>
          </div>
        );
      case 'accepted':
        return <Button size="sm" fullWidth onClick={() => updateStatus(id, 'preparing')} disabled={isUpdating} isLoading={isUpdating}>Start Preparing</Button>;
      case 'preparing':
        return <Button size="sm" fullWidth onClick={() => updateStatus(id, 'ready_for_pickup')} disabled={isUpdating} isLoading={isUpdating}>Mark Ready</Button>;
      case 'ready_for_pickup':
        return <Button size="sm" fullWidth onClick={() => updateStatus(id, 'out_for_delivery')} disabled={isUpdating} isLoading={isUpdating}>Out for Delivery</Button>;
      case 'out_for_delivery':
        return <Button size="sm" fullWidth onClick={() => updateStatus(id, 'delivered')} disabled={isUpdating} isLoading={isUpdating}>Mark Delivered</Button>;
      default:
        return null; // delivered or cancelled
    }
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  if (loading && orders.length === 0) return <div>Loading orders...</div>;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Order Management</h1>

      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Active Orders ({activeOrders.length})</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {activeOrders.length === 0 ? (
          <div className="dashboard-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No active orders at the moment.
          </div>
        ) : (
          activeOrders.map(order => (
            <div key={order.id} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>#{order.id.slice(-6).toUpperCase()}</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={14} /> {new Date(order.placedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  background: order.status === 'pending' ? '#fef3c7' : '#e0e7ff',
                  color: order.status === 'pending' ? '#b45309' : '#4338ca'
                }}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>
              
              <div style={{ flex: 1, marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Items:</div>
                {order.items.map((item: OrderItem) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span>{item.quantity} x {item.foodName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>₹{item.totalPrice || (item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <span>Total</span>
                  <span>₹{order.totalAmount}</span>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <MapPin size={14} /> Delivery Address Provided
                  </div>
                  {/* Real app would show customer details here if included in backend payload */}
                </div>
              </div>
              
              <div style={{ marginTop: 'auto' }}>
                {getNextStatusAction(order.status, order.id)}
              </div>
            </div>
          ))
        )}
      </div>

      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Past Orders</h2>
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Order ID</th>
              <th style={{ padding: '1rem 1.5rem' }}>Time</th>
              <th style={{ padding: '1rem 1.5rem' }}>Amount</th>
              <th style={{ padding: '1rem 1.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pastOrders.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>No past orders.</td></tr>
            ) : (
              pastOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                    {new Date(order.placedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>₹{order.totalAmount}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      background: order.status === 'delivered' ? '#dcfce7' : '#fee2e2',
                      color: order.status === 'delivered' ? '#16a34a' : '#ef4444'
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
