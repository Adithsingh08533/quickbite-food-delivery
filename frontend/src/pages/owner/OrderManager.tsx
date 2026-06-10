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
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateStatus(id, 'accepted')} className="flex-1" disabled={isUpdating} isLoading={isUpdating}>Accept</Button>
            <Button size="sm" variant="danger" onClick={() => updateStatus(id, 'cancelled')} className="flex-1" disabled={isUpdating}>Reject</Button>
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

  if (loading && orders.length === 0) return <div className="p-8 text-center text-text-secondary">Loading orders...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-8">Order Management</h1>

      <h2 className="text-lg font-semibold text-text-secondary mb-4 border-b border-border pb-2">Active Orders ({activeOrders.length})</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {activeOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-border p-12 text-center text-text-secondary shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <Clock size={28} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium">No active orders at the moment.</p>
            <p className="text-sm mt-1">New orders will appear here automatically.</p>
          </div>
        ) : (
          activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-border shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-border bg-gray-50/50 rounded-t-xl flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">#{order.id.slice(-6).toUpperCase()}</h3>
                  <div className="text-text-secondary text-sm flex items-center gap-1.5 mt-1 font-medium">
                    <Clock size={14} /> {new Date(order.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                  order.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider">Items</div>
                <div className="space-y-3 mb-6 flex-1">
                  {order.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between text-sm items-start gap-4">
                      <span className="font-medium text-text-primary">
                        <span className="text-text-secondary font-bold mr-1.5">{item.quantity}×</span> 
                        {item.foodName}
                      </span>
                      <span className="text-text-secondary shrink-0 font-medium">₹{item.totalPrice || (item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-dashed border-border mt-auto">
                  <div className="flex justify-between font-bold text-text-primary mb-3 items-center">
                    <span>Total Amount</span>
                    <span className="text-lg">₹{order.totalAmount}</span>
                  </div>
                  
                  <div className="text-xs text-text-secondary font-medium bg-gray-50 p-2.5 rounded border border-gray-100">
                    <div className="flex items-center gap-1.5 text-text-primary">
                      <MapPin size={14} className="text-primary" /> Delivery Address Provided
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 pt-0 mt-auto">
                {getNextStatusAction(order.status, order.id)}
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="text-lg font-semibold text-text-secondary mb-4 border-b border-border pb-2">Past Orders</h2>
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-left text-text-secondary text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Order ID</th>
                <th className="p-4 font-semibold whitespace-nowrap">Time</th>
                <th className="p-4 font-semibold whitespace-nowrap">Amount</th>
                <th className="p-4 font-semibold whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pastOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-secondary">No past orders.</td>
                </tr>
              ) : (
                pastOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-text-primary whitespace-nowrap">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4 text-text-secondary whitespace-nowrap">
                      {new Date(order.placedAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 font-medium text-text-primary whitespace-nowrap">₹{order.totalAmount}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                        order.status === 'delivered' ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
