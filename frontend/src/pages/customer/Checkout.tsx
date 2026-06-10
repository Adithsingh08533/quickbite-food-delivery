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
        navigate('/orders', { state: { success: true, paymentMethod: 'cod' } });
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
            navigate('/orders', { state: { success: true, paymentMethod: 'online' } });
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

  if (loading) return <div className="container mx-auto px-4 py-16">Loading checkout...</div>;

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="text-text-secondary mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Button onClick={() => navigate('/')}>Explore Restaurants</Button>
      </div>
    );
  }

  const tax = (subtotal - discountAmount) * 0.05;
  const deliveryFee = (subtotal - discountAmount) > 500 ? 0 : 40;
  const total = subtotal - discountAmount + tax + deliveryFee;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 w-full min-w-0 animate-slide-up">
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CheckCircle className="text-success" size={24} /> Logged in as {user?.name}</h2>
          <p className="text-text-secondary">{user?.email}</p>
        </div>

        {/* Address Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-primary" size={24} /> Delivery Address</h2>
          
          {!isAddingAddress && addresses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  className={`border-2 rounded-md p-4 cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/10' : 'border-border bg-gray-50 hover:border-gray-300'}`}
                  onClick={() => setSelectedAddressId(addr.id)}
                >
                  <div className={`text-xs font-bold uppercase mb-2 px-1.5 py-0.5 rounded inline-block ${selectedAddressId === addr.id ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}`}>{addr.label}</div>
                  <div className="text-sm leading-relaxed text-text-primary">
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
            <form className="bg-gray-50 p-6 rounded-md border border-border flex flex-col gap-4 animate-fade-in" onSubmit={handleSubmit(onAddAddress)}>
              <h3 className="text-base font-semibold mb-2">Add a new delivery address</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input label="Flat/House" placeholder="Flat No / Floor" error={errors.flatHouse?.message} {...register('flatHouse')} />
                <Input label="Street" placeholder="Street Name" error={errors.street?.message} {...register('street')} />
              </div>
              <Input label="Area" placeholder="Area / Locality" error={errors.area?.message} {...register('area')} />
              <div className="flex flex-col sm:flex-row gap-4">
                <Input label="City" placeholder="City" error={errors.city?.message} {...register('city')} />
                <Input label="State" placeholder="State" error={errors.state?.message} {...register('state')} />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input label="Pincode" placeholder="6-digit PIN" error={errors.pinCode?.message} {...register('pinCode')} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-secondary">Address Type</label>
                  <select className="w-full h-[46px] px-4 text-base text-text-primary bg-gray-50 border-[1.5px] border-gray-200 rounded-md outline-none focus:bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10" {...register('label')}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                <Button type="submit">Save Address</Button>
                {addresses.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => setIsAddingAddress(false)}>Cancel</Button>
                )}
              </div>
            </form>
          )}
        </div>
        
        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ShieldCheck className="text-primary" size={24} /> Payment Method</h2>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paymentMethod" 
                value="online" 
                checked={paymentMethod === 'online'} 
                onChange={() => setPaymentMethod('online')} 
                className="w-4 h-4 text-primary focus:ring-primary/20"
              />
              Pay Online (Razorpay)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="paymentMethod" 
                value="cod" 
                checked={paymentMethod === 'cod'} 
                onChange={() => setPaymentMethod('cod')}
                className="w-4 h-4 text-primary focus:ring-primary/20" 
              />
              Cash on Delivery (COD)
            </label>
          </div>
        </div>
        
        {/* Payment Warning */}
        {paymentMethod === 'online' && (
          <div className="flex items-center gap-2 text-text-secondary text-sm mt-4">
            <ShieldCheck size={18} className="text-success" />
            Payments are securely processed by Razorpay (Test Mode)
          </div>
        )}
      </div>

      <div className="w-full lg:w-[380px] shrink-0 bg-white rounded-xl shadow-md p-6 border border-border lg:sticky lg:top-[90px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold mb-6">Order Summary</h2>
        
        <div className="mb-6 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="flex-1 pr-4">{item.quantity} x {item.name}</span>
              <div className="flex items-center gap-4 shrink-0">
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
                  className="bg-transparent border-none text-error cursor-pointer text-sm font-semibold p-0 hover:underline"
                  disabled={isProcessing}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Code Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-dashed border-gray-300">
          <div className="flex items-center gap-2 mb-3 font-semibold text-text-primary">
            <Tag size={18} className="text-primary" /> Apply Promo Code
          </div>
          
          {appliedCoupon ? (
            <div className="flex justify-between items-center bg-success-bg p-3 rounded-md border border-success/30">
              <div>
                <div className="font-semibold text-success">{appliedCoupon.code} applied!</div>
                <div className="text-xs text-success">You saved ₹{discountAmount.toFixed(2)}</div>
              </div>
              <button onClick={removeCoupon} className="bg-transparent border-none text-error font-semibold cursor-pointer text-sm hover:underline">REMOVE</button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter code" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-gray-300 outline-none focus:border-primary"
                />
                <Button size="sm" onClick={applyCoupon} isLoading={isApplyingCoupon} disabled={!couponCode.trim()}>APPLY</Button>
              </div>
              {couponError && <div className="text-error text-xs mt-2">{couponError}</div>}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Item Total</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Item Discount</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Delivery Fee</span>
            <span>{deliveryFee === 0 ? <span className="text-success font-semibold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Govt Taxes (5%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold pt-4 border-t border-dashed border-border mt-4">
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
