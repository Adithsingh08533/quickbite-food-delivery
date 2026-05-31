import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Clock, Utensils, Truck, CheckCircle2, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';
import { Button } from '../../components/ui/Button';
import './OrderHistory.css';

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
  restaurantName: string; // Not returned directly by default, but assume it is or fetch it
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

  const getTimelineStatus = (status: string) => {
    const states = ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = states.indexOf(status);
    
    // If cancelled, just show simple state
    if (status === 'cancelled') return null;

    return (
      <div className="timeline-container">
        <div className="timeline">
          {[
            { id: 'pending', label: 'Placed', icon: <CheckCircle size={14} /> },
            { id: 'accepted', label: 'Accepted', icon: <CheckCircle size={14} /> },
            { id: 'preparing', label: 'Preparing', icon: <Utensils size={14} /> },
            { id: 'out_for_delivery', label: 'On the Way', icon: <Truck size={14} /> },
            { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 size={14} /> },
          ].map((step) => {
            // Map the detailed states to the 5 visual steps
            let stepIndex = states.indexOf(step.id);
            // Handle 'ready_for_pickup' mapping to 'preparing' visually or between preparing/delivery
            if (status === 'ready_for_pickup' && step.id === 'preparing') return <Step key={step.id} label={step.label} icon={step.icon} state="completed" />;
            
            let state = 'pending';
            if (currentIndex > stepIndex || (status === 'ready_for_pickup' && stepIndex <= 2)) state = 'completed';
            else if (currentIndex === stepIndex) state = 'active';

            return <Step key={step.id} label={step.label} icon={step.icon} state={state} />;
          })}
        </div>
      </div>
    );
  };

  const Step = ({ label, icon, state }: { label: string, icon: React.ReactNode, state: string }) => (
    <div className={`timeline-step ${state}`}>
      <div className="timeline-icon">{icon}</div>
      <div className="timeline-label">{label}</div>
    </div>
  );

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

  if (loading) return <div className="container" style={{ padding: '4rem 0' }}>Loading orders...</div>;

  return (
    <div className="container orders-container animate-fade-in">
      {showSuccess && (
        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={20} />
          Payment successful! Your order has been placed.
        </div>
      )}

      <h1 className="orders-title">Your Orders</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0' }}>
          <Utensils size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <h3>No orders yet</h3>
          <p>Looks like you haven't made your menu yet.</p>
        </div>
      ) : (
        <div>
          {orders.map(order => (
            <div key={order.id} className="order-card animate-slide-up">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id.slice(-8).toUpperCase()}</h3>
                  <div className="order-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {formatDate(order.placedAt)}
                    </span>
                  </div>
                </div>
                <div className={`order-status status-${order.status}`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>

              {getTimelineStatus(order.status)}

              <div className="order-items">
                {order.items.map(item => (
                  <div key={item.id} className="o-item">
                    <div className="o-item-name">{item.quantity} x {item.foodName}</div>
                    <div className="o-item-price">₹{item.unitPrice * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                <span className="order-total">₹{order.totalAmount}</span>
              </div>
              
              {order.status === 'delivered' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'flex-end' }}>
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
        <div className="modal-overlay" onClick={() => setReviewOrder(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', marginTop: 0 }}>Review Order</h2>
            
            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star size={32} color={star <= rating ? 'var(--warning)' : 'var(--gray-300)'} fill={star <= rating ? 'var(--warning)' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Share details of your own experience at this place"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
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
