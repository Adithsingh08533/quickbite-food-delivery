import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, IndianRupee, Info, Heart } from 'lucide-react';
import { api } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { Button } from '../../components/ui/Button';
import './RestaurantDetail.css';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  owner_reply?: string;
  replied_at?: string;
  created_at: string;
  user_name: string;
}

export const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, subtotal, restaurantId: cartRestaurantId, addToCart, updateQuantity } = useCartStore();
  const { wishlist, fetchWishlist, toggleWishlist } = useWishlistStore();
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch restaurant details and menu in parallel
        const [resDetails, resFood, resCats, resReviews] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/restaurants/${id}/food-items`),
          api.get(`/restaurants/${id}/categories`),
          api.get(`/reviews/restaurant/${id}`)
        ]);
        
        setRestaurant(resDetails.data.data);
        setFoodItems(resFood.data.data || []);
        setCategories(resCats.data.data || []);
        setReviews(resReviews.data.data?.reviews || []);
      } catch (err) {
        console.error('Failed to fetch restaurant details', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
    if (isAuthenticated) fetchWishlist();
  }, [id, isAuthenticated, fetchWishlist]);

  const handleAddToCart = async (foodItemId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Check single-restaurant policy
    if (items.length > 0 && cartRestaurantId !== id) {
      setCartError('Your cart has items from another restaurant. Please clear your cart first.');
      setTimeout(() => setCartError(null), 4000);
      return;
    }

    setCartError(null);
    try {
      await addToCart(foodItemId, 1);
    } catch (err: any) {
      setCartError(err.message || 'Failed to add item to cart. Please try again.');
      setTimeout(() => setCartError(null), 4000);
    }
  };

  const getCartQuantity = (foodItemId: string) => {
    const item = items.find(i => i.foodItemId === foodItemId);
    return item ? item.quantity : 0;
  };
  
  const getCartItemId = (foodItemId: string) => {
    const item = items.find(i => i.foodItemId === foodItemId);
    return item?.id;
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading restaurant...</div>;
  }

  if (!restaurant) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Restaurant not found</div>;
  }

  // Group food items by category
  const groupedFood: Record<string, FoodItem[]> = {};
  categories.forEach(cat => {
    groupedFood[cat.name] = [];
  });
  groupedFood['Uncategorized'] = [];

  foodItems.forEach(item => {
    // In our simplified schema, we don't have categoryId on foodItem, 
    // so we'll just put them all in "All Items" or split if we add categoryId.
    // Assuming backend returns all items, we'll put them in a generic category for now.
    if (!groupedFood['All Items']) groupedFood['All Items'] = [];
    groupedFood['All Items'].push(item);
  });

  return (
    <div>
      {/* Header */}
      <div className="rd-header animate-fade-in">
        <img 
          src={restaurant.coverImage || restaurant.imageUrl || '/images/restaurants/restaurant-1.jpg'} 
          alt={restaurant.name} 
          className="rd-cover-image" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/restaurants/restaurant-1.jpg';
          }}
        />
        <div className="rd-header-content">
          <div className="container">
            <h1 className="rd-title">{restaurant.name}</h1>
            <p style={{ color: '#d1d5db', marginBottom: '1rem', fontSize: '1.125rem' }}>
              {restaurant.address}
            </p>
            <div className="rd-meta-row">
              <div className="rd-rating-badge">
                <Star size={16} fill="currentColor" />
                <span>{Number(restaurant.rating).toFixed(1)}</span>
              </div>
              <div className="rd-meta-item">
                <Clock size={18} />
                <span>{restaurant.deliveryTime} mins</span>
              </div>
              <div className="rd-meta-item">
                <IndianRupee size={18} />
                <span>{restaurant.minOrderValue} for two</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container rd-layout">
        {/* Menu Section */}
        <div className="rd-menu-section animate-slide-up">
          {!restaurant.isOpen && (
            <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={20} />
              <strong>Restaurant is currently closed.</strong> You can browse the menu but cannot place orders.
            </div>
          )}

          {/* Cart error toast */}
          {cartError && (
            <div style={{
              backgroundColor: 'var(--error-bg)', color: 'var(--error)',
              padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
              gap: '0.5rem', border: '1px solid var(--error)', fontSize: '0.875rem',
              animation: 'fadeIn 0.2s ease-out',
            }}>
              <Info size={16} />
              <span>{cartError}</span>
            </div>
          )}


          {foodItems.length === 0 ? (
            <p>No items available right now.</p>
          ) : (
            <div>
              <h2 className="section-title">All Items</h2>
              {foodItems.map((item) => {
                const qty = getCartQuantity(item.id);
                const cartItemId = getCartItemId(item.id);
                
                return (
                  <div key={item.id} className="food-card">
                    <div className="fc-details">
                      <div className="d-flex justify-between align-center">
                        <div className={`fc-veg-indicator ${item.isVeg ? 'fc-veg' : 'fc-non-veg'}`} title={item.isVeg ? "Veg" : "Non-Veg"} />
                        {isAuthenticated && (
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                            onClick={() => toggleWishlist(item.id)}
                            title="Toggle Wishlist"
                          >
                            <Heart 
                              size={20} 
                              color={wishlist.some(w => w.id === item.id) ? 'var(--error)' : 'var(--gray-400)'} 
                              fill={wishlist.some(w => w.id === item.id) ? 'var(--error)' : 'none'} 
                            />
                          </button>
                        )}
                      </div>
                      <h3 className="fc-name">{item.name}</h3>
                      <div className="fc-price">₹{item.price}</div>
                      <p className="fc-desc">{item.description}</p>
                    </div>
                    <div className="fc-image-container">
                      <img 
                        src={item.imageUrl || '/images/foods/veg-burger.jpg'} 
                        alt={item.name} 
                        className="fc-image" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/foods/veg-burger.jpg';
                        }}
                      />
                      
                      {restaurant.isOpen && item.isAvailable && (
                        qty > 0 && cartItemId ? (
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => updateQuantity(cartItemId, qty - 1)}>-</button>
                            <span className="qty-value">{qty}</span>
                            <button className="qty-btn" onClick={() => updateQuantity(cartItemId, qty + 1)}>+</button>
                          </div>
                        ) : (
                          <button className="fc-add-btn" onClick={() => handleAddToCart(item.id)}>
                            ADD
                          </button>
                        )
                      )}
                      
                      {!item.isAvailable && (
                        <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#f3f4f6', color: '#9ca3af', padding: '4px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #d1d5db', fontSize: '0.75rem', fontWeight: 600 }}>
                          Sold Out
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="rd-cart-sidebar animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="cart-title">Cart</h3>
          
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              <p>Your cart is empty</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Good food is always cooking! Go ahead, order some yummy items from the menu.</p>
            </div>
          ) : (
            <>
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div className={`fc-veg-indicator ${item.isVeg ? 'fc-veg' : 'fc-non-veg'}`} style={{ width: 12, height: 12, marginBottom: 2 }} />
                    <div className="ci-name">{item.name}</div>
                    <div className="ci-price">₹{item.price}</div>
                  </div>
                  <div className="ci-controls">
                    <button className="ci-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span className="ci-qty">{item.quantity}</span>
                    <button className="ci-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
              ))}
              
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              
              <Button fullWidth onClick={() => navigate('/checkout')}>
                Checkout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container" style={{ marginTop: '3rem', paddingBottom: '4rem' }}>
        <h2 className="section-title">Reviews ({restaurant.reviewCount || 0})</h2>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }}>
            {reviews.map(review => (
              <div key={review.id} style={{ padding: '1.5rem', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{review.user_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)' }}>
                    <Star size={16} fill="currentColor" />
                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{review.rating}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--gray-700)', marginBottom: '0.5rem' }}>{review.comment}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
                
                {review.owner_reply && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Response from Owner</div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', margin: 0 }}>{review.owner_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
