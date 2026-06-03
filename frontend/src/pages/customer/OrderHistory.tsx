import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Clock, Utensils, Truck, CheckCircle2, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';
import { Button } from '../../components/ui/Button';

interface OrderItem {
  id: string;
  foodItemId: string;
  foodName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  totalAmount: number;
  placedAt: string;
  items: OrderItem[];
}

export const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const location = useLocation();
  const showSuccess = location.state?.success;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders');
        setOrders(data.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (updatedOrder: Order) => {
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o)
      );
    };

    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [socket]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'bg-amber-100 text-amber-700',
      'accepted': 'bg-blue-100 text-blue-700',
      'preparing': 'bg-purple-100 text-purple-700',
      'ready_for_pickup': 'bg-indigo-100 text-indigo-700',
      'out_for_delivery': 'bg-orange-100 text-orange-700',
      'delivered': 'bg-emerald-100 text-emerald-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getTimelineStatus = (status: string) => {
    const states = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = states.indexOf(status);
    
    // If cancelled, just show simple state
    if (status === 'cancelled') return null;

    return (
      <div className="p-6 border-t border-border bg-gray-50/50 hidden sm:block">
        <div className="flex justify-between relative max-w-2xl mx-auto">
          {/* Progress Line */}
          <div className="absolute top-[14px] left-[30px] right-[30px] h-0.5 bg-border z-10"></div>
          
          {[
            { id: 'pending', label: 'Placed', icon: <CheckCircle size={14} /> },
            { id: 'accepted', label: 'Accepted', icon: <CheckCircle size={14} /> },
            { id: 'preparing', label: 'Preparing', icon: <Utensils size={14} /> },
            { id: 'out_for_delivery', label: 'On the Way', icon: <Truck size={14} /> },
            { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 size={14} /> },
          ].map((step) => {
            let stepIndex = states.indexOf(step.id);
            if (status === 'ready_for_pickup' && step.id === 'preparing') {
              return <Step key={step.id} label={step.label} icon={step.icon} state="completed" />;
            }
            
            let state = 'pending';
            if (currentIndex > stepIndex || (status === 'ready_for_pickup' && stepIndex <= 2)) state = 'completed';
            else if (currentIndex === stepIndex) state = 'active';

            return <Step key={step.id} label={step.label} icon={step.icon} state={state} />;
          })}
        </div>
      </div>
    );
  };

  const Step = ({ label, icon, state }: { label: string, icon: React.ReactNode, state: string }) => {
    let iconClass = "w-[30px] h-[30px] rounded-full bg-white border-2 flex items-center justify-center transition-colors z-20 ";
    let labelClass = "text-xs font-semibold uppercase mt-2 ";
    
    if (state === 'active') {
      iconClass += "border-primary bg-primary text-white";
      labelClass += "text-primary";
    } else if (state === 'completed') {
      iconClass += "border-success bg-success text-white";
      labelClass += "text-text-secondary";
    } else {
      iconClass += "border-border text-text-muted";
      labelClass += "text-text-muted";
    }

    return (
      <div className="flex flex-col items-center relative z-20">
        <div className={iconClass}>{icon}</div>
        <div className={labelClass}>{label}</div>
      </div>
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;

    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        orderId: reviewOrder.id,
        restaurantId: reviewOrder.restaurantId,
        rating,
        comment
      });
      alert('Review submitted successfully!');
      setReviewOrder(null);
      setComment('');
      setRating(5);
    } catch (err: any) {
      if (err.response?.data?.details) {
        const issues = err.response.data.details.map((d: any) => `${d.field.replace('body.', '')}: ${d.message}`).join('\n');
        alert(`Validation failed:\n${issues}`);
      } else {
        alert(err.response?.data?.error || 'Failed to submit review');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-16">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 animate-fade-in">
      {showSuccess && (
        <div className="bg-success-bg text-success p-4 rounded-md mb-8 flex items-center gap-2 font-semibold">
          <CheckCircle size={20} />
          Payment successful! Your order has been placed.
        </div>
      )}

      <h1 className="text-3xl font-extrabold mb-8 text-text-primary">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center text-text-secondary py-16">
          <Utensils size={48} className="opacity-50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
          <p>Looks like you haven't made any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden transition-shadow hover:shadow-md animate-slide-up">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-border bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold mb-1">Order #{order.id.slice(-8).toUpperCase()}</h3>
                  <div className="text-text-secondary text-sm flex items-center gap-1">
                    <Clock size={14} /> {formatDate(order.placedAt)}
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>

              {getTimelineStatus(order.status)}

              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="font-medium text-text-primary">{item.quantity} x {item.foodName}</div>
                      <div className="text-text-secondary">₹{item.unitPrice * item.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-dashed border-border flex justify-between items-center bg-gray-50/30">
                <span className="text-text-secondary text-sm sm:text-base">Total Amount</span>
                <span className="text-lg font-bold text-text-primary">₹{order.totalAmount}</span>
              </div>
              
              {order.status === 'delivered' && (
                <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setReviewOrder(order)}>
                    Leave a Review
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={() => setReviewOrder(null)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Review Order</h2>
            
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-text-primary">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="bg-transparent border-none cursor-pointer p-0 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star size={36} className={`${star <= rating ? 'text-warning fill-warning' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-text-primary">Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 rounded-md border border-gray-300 min-h-[120px] resize-y outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Share details of your own experience at this place"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => setReviewOrder(null)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmittingReview}>Submit Review</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
