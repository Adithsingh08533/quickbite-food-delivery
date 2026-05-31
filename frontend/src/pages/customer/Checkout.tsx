import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, ShieldCheck, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './Checkout.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const addressSchema = z.object({
  flatHouse: z.string().min(1, 'Flat/House is required'),
  street: z.string().min(2, 'Street is required'),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
  label: z.enum(['Home', 'Work', 'Other']),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, subtotal, restaurantId, clearCart, removeItem } = useCartStore();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const isProcessingRef = useRef(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Idempotency state: Keep track of created order so we don't recreate it
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Home' }
  });

  // Reset the created order if the user modifies cart or checkout details
  useEffect(() => {
    setCreatedOrderId(null);
  }, [items.length, subtotal, selectedAddressId, paymentMethod, appliedCoupon?.code]);

  useEffect(() => {
    // If cart is empty, we don't need to fetch addresses unless we want to, 
    // but we won't redirect anymore so the user can see the empty cart page.
    if (items.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/users/addresses');
        const addresses = data.data || [];
        setAddresses(addresses);
        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id);
        } else {
          setIsAddingAddress(true);
        }
      } catch (err) {
        console.error('Failed to fetch addresses', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [items.length, navigate]);

  const onAddAddress = async (data: AddressFormData) => {
    try {
      const response = await api.post('/users/addresses', data);
      const newAddress = response.data.data;
      setAddresses([...addresses, newAddress]);
      setSelectedAddressId(newAddress.id);
      setIsAddingAddress(false);
      reset();
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const response = await api.post('/coupons/validate', {
        code: couponCode,
        cartTotal: subtotal
      });
      setAppliedCoupon(response.data.data.coupon);
      setDiscountAmount(response.data.data.discountAmount);
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Failed to apply coupon');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError('');
  };

  const handlePayment = async () => {
    if (isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;

    if (!selectedAddressId) {
      alert('Please select a delivery address');
      isProcessingRef.current = false;
      return;
    }

    if (!restaurantId) {
      isProcessingRef.current = false;
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Create Order in DB (Idempotent check)
      let orderId = createdOrderId;
      
      if (!orderId) {
        const orderPayload = {
          deliveryAddressId: selectedAddressId,
          paymentMethod: paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
        };
        
        const orderRes = await api.post('/orders', orderPayload);
        orderId = orderRes.data.data.id;
        setCreatedOrderId(orderId);
      }

      if (paymentMethod === 'cod') {
        // 5. Success! Clear cart and redirect for COD
        await clearCart();
        navigate('/orders', { state: { success: true } });
        return;
      }

      // 2. Create Razorpay Order
      const rzpRes = await api.post(`/payments/orders/${orderId}/razorpay`);
      const { razorpayOrderId, keyId, amount, currency } = rzpRes.data.data;

      // 3. Initialize Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "QuickBite",
        description: "Food Delivery Order",
        image: "https://i.imgur.com/3g7nmJC.png", // Example logo
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // 4. Verify Payment on Backend
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // 5. Success! Clear cart and redirect
            await clearCart();
            navigate('/orders', { state: { success: true } });
          } catch (err) {
            alert('Payment verification failed. Please contact support if amount was deducted.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: {
          color: "#ff6b35"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            isProcessingRef.current = false;
          }
        }
      };

      if (!window.Razorpay) {
        alert('Payment gateway failed to load. Please refresh the page and try again.');
        setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
        isProcessingRef.current = false;
      });
      rzp.open();

    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to initialize payment');
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0' }}>Loading checkout...</div>;

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
        <Button onClick={() => navigate('/')}>Explore Restaurants</Button>
      </div>
    );
  }

  const tax = (subtotal - discountAmount) * 0.05;
  const deliveryFee = (subtotal - discountAmount) > 500 ? 0 : 40;
  const total = subtotal - discountAmount + tax + deliveryFee;

  return (
    <div className="container checkout-container">
      <div className="checkout-main animate-slide-up">
        {/* Account Info */}
        <div className="checkout-section">
          <h2><CheckCircle color="var(--success)" size={24} /> Logged in as {user?.name}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
        </div>

        {/* Address Selection */}
        <div className="checkout-section">
          <h2><MapPin color="var(--primary)" size={24} /> Delivery Address</h2>
          
          {!isAddingAddress && addresses.length > 0 && (
            <div className="address-grid">
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAddressId(addr.id)}
                >
                  <div className="address-type">{addr.label}</div>
                  <div className="address-text">
                    {addr.flatHouse}, {addr.street}, {addr.area}<br />
                    {addr.city}, {addr.state} - {addr.pinCode}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isAddingAddress && (
            <Button variant="outline" onClick={() => setIsAddingAddress(true)}>
              + Add New Address
            </Button>
          )}

          {isAddingAddress && (
            <form className="new-address-form animate-fade-in" onSubmit={handleSubmit(onAddAddress)}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Add a new delivery address</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Input label="Flat/House" placeholder="Flat No / Floor" error={errors.flatHouse?.message} {...register('flatHouse')} />
                <Input label="Street" placeholder="Street Name" error={errors.street?.message} {...register('street')} />
              </div>
              <Input label="Area" placeholder="Area / Locality" error={errors.area?.message} {...register('area')} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Input label="City" placeholder="City" error={errors.city?.message} {...register('city')} />
                <Input label="State" placeholder="State" error={errors.state?.message} {...register('state')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Input label="Pincode" placeholder="6-digit PIN" error={errors.pinCode?.message} {...register('pinCode')} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="input-label">Address Type</label>
                  <select className="input-field" {...register('label')}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <Button type="submit">Save Address</Button>
                {addresses.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setIsAddingAddress(false)}>Cancel</Button>
                )}
              </div>
            </form>
          )}
        </div>
        
        {/* Payment Method Selection */}
        <div className="checkout-section">
          <h2><ShieldCheck color="var(--primary)" size={24} /> Payment Method</h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="online" 
                checked={paymentMethod === 'online'} 
                onChange={() => setPaymentMethod('online')} 
              />
              Pay Online (Razorpay)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="cod" 
                checked={paymentMethod === 'cod'} 
                onChange={() => setPaymentMethod('cod')} 
              />
              Cash on Delivery (COD)
            </label>
          </div>
        </div>
        
        {/* Payment Warning */}
        {paymentMethod === 'online' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem' }}>
            <ShieldCheck size={18} color="var(--success)" />
            Payments are securely processed by Razorpay (Test Mode)
          </div>
        )}
      </div>

      <div className="checkout-sidebar animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Order Summary</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {items.map(item => (
            <div key={item.id} className="summary-item">
              <span style={{ flex: 1 }}>{item.quantity} x {item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>₹{item.price * item.quantity}</span>
                <button 
                  onClick={async () => {
                    try {
                      await removeItem(item.id);
                      alert('Item removed successfully');
                    } catch (err: any) {
                      alert(err.message || 'Failed to remove item');
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, padding: 0 }}
                  disabled={isProcessing}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code Section */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--gray-300)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600 }}>
            <Tag size={18} color="var(--primary)" /> Apply Promo Code
          </div>
          
          {appliedCoupon ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--success-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-border)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>{appliedCoupon.code} applied!</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>You saved ₹{discountAmount.toFixed(2)}</div>
              </div>
              <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: 'var(--error)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>REMOVE</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Enter code" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-300)' }}
                />
                <Button size="sm" onClick={applyCoupon} isLoading={isApplyingCoupon} disabled={!couponCode.trim()}>APPLY</Button>
              </div>
              {couponError && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{couponError}</div>}
            </div>
          )}
        </div>
        
        <div className="bill-details">
          <div className="summary-item">
            <span style={{ color: 'var(--text-secondary)' }}>Item Total</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="summary-item" style={{ color: 'var(--success)' }}>
              <span>Item Discount</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-item">
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Fee</span>
            <span>{deliveryFee === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span>
          </div>
          <div className="summary-item">
            <span style={{ color: 'var(--text-secondary)' }}>Govt Taxes (5%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          
          <div className="summary-total">
            <span>To Pay</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          fullWidth 
          size="lg" 
          onClick={handlePayment} 
          isLoading={isProcessing}
          disabled={!selectedAddressId}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};
