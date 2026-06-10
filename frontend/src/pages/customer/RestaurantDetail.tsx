import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, IndianRupee, Info, Heart } from 'lucide-react';
import { api } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { Button } from '../../components/ui/Button';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch restaurant details and menu in parallel
        const [resDetails, resFood, , resReviews] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/restaurants/${id}/food-items`),
          api.get(`/restaurants/${id}/categories`),
          api.get(`/reviews/restaurant/${id}`)
        ]);
        
        setRestaurant(resDetails.data.data);
        setFoodItems(resFood.data.data || []);
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
    return <div className="container mx-auto px-4 py-16 text-center">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return <div className="container mx-auto px-4 py-16 text-center">Restaurant not found</div>;
  }

  return (
    <div className="pb-32 lg:pb-16 relative">
      {/* Header */}
      <div className="relative bg-secondary text-white mb-8 animate-fade-in">
        <img 
          src={restaurant.coverImage || restaurant.imageUrl || '/images/restaurants/restaurant-1.jpg'} 
          alt={restaurant.name} 
          className="w-full h-[250px] md:h-[300px] object-cover opacity-60" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/restaurants/restaurant-1.jpg';
          }}
        />
        <div className="absolute bottom-0 left-0 w-full py-6 md:py-8 bg-gradient-to-t from-black/90 to-transparent">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{restaurant.name}</h1>
            <p className="text-gray-300 mb-4 text-base md:text-lg">
              {restaurant.address}
            </p>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-gray-200">
              <div className="bg-success text-white px-2 py-1 rounded font-bold flex items-center gap-1">
                <Star size={16} fill="currentColor" />
                <span>{Number(restaurant.rating).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={18} />
                <span>{restaurant.deliveryTime} mins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IndianRupee size={18} />
                <span>{restaurant.minOrderValue} for two</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        {/* Menu Section */}
        <div className="flex-1 w-full animate-slide-up">
          {!restaurant.isOpen && (
            <div className="bg-error-bg text-error p-4 rounded-md mb-8 flex items-center gap-2 font-semibold">
              <Info size={20} />
              <span><strong>Restaurant is currently closed.</strong> You can browse the menu but cannot place orders.</span>
            </div>
          )}

          {/* Cart error toast */}
          {cartError && (
            <div className="bg-error-bg text-error px-4 py-3 rounded-md mb-6 flex items-center gap-2 border border-error text-sm animate-fade-in">
              <Info size={16} />
              <span>{cartError}</span>
            </div>
          )}

          {foodItems.length === 0 ? (
            <p className="text-text-secondary">No items available right now.</p>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-text-primary border-b border-border pb-2">All Items</h2>
              <div className="flex flex-col">
                {foodItems.map((item) => {
                  const qty = getCartQuantity(item.id);
                  const cartItemId = getCartItemId(item.id);
                  
                  return (
                    <div key={item.id} className="flex justify-between py-6 border-b border-border last:border-b-0 gap-4">
                      <div className="flex-1 pr-0 md:pr-6">
                        <div className="flex justify-between items-center mb-2">
                          <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${item.isVeg ? 'border-success' : 'border-error'}`} title={item.isVeg ? "Veg" : "Non-Veg"}>
                            <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-success' : 'bg-error'}`} />
                          </div>
                          {isAuthenticated && (
                            <button 
                              className="bg-transparent border-none cursor-pointer p-1 transition-transform hover:scale-110 focus:outline-none"
                              onClick={() => toggleWishlist(item.id)}
                              title="Toggle Wishlist"
                            >
                              <Heart 
                                size={22} 
                                className={wishlist.some(w => w.id === item.id) ? 'text-error fill-error' : 'text-gray-400'} 
                              />
                            </button>
                          )}
                        </div>
                        <h3 className="text-lg font-bold mb-1 text-text-primary">{item.name}</h3>
                        <div className="font-semibold text-text-primary mb-2">₹{item.price}</div>
                        <p className="text-text-secondary text-sm line-clamp-2 md:line-clamp-3">{item.description}</p>
                      </div>
                      
                      <div className="w-[110px] md:w-[130px] h-[110px] md:h-[130px] shrink-0 relative rounded-lg overflow-visible">
                        <img 
                          src={item.imageUrl || '/images/foods/veg-burger.jpg'} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-lg shadow-sm" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/foods/veg-burger.jpg';
                          }}
                        />
                        
                        {restaurant.isOpen && item.isAvailable && (
                          qty > 0 && cartItemId ? (
                            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-white border border-border shadow-sm rounded-md flex items-center h-[36px] overflow-hidden">
                              <button className="px-3 h-full text-success font-bold text-lg hover:bg-gray-100 flex items-center justify-center" onClick={() => updateQuantity(cartItemId, qty - 1)}>-</button>
                              <span className="px-2 font-semibold text-sm">{qty}</span>
                              <button className="px-3 h-full text-success font-bold text-lg hover:bg-gray-100 flex items-center justify-center" onClick={() => updateQuantity(cartItemId, qty + 1)}>+</button>
                            </div>
                          ) : (
                            <button 
                              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-white text-success border border-border shadow-sm px-6 py-1.5 rounded-md font-bold text-sm hover:bg-gray-50 hover:shadow-md transition-all"
                              onClick={() => handleAddToCart(item.id)}
                            >
                              ADD
                            </button>
                          )
                        )}
                        
                        {!item.isAvailable && (
                          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-gray-100 text-gray-400 px-4 py-1 rounded-md border border-gray-300 text-xs font-bold whitespace-nowrap">
                            Sold Out
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-2xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] p-4 max-h-[60vh] overflow-y-auto lg:sticky lg:top-[90px] lg:w-[350px] lg:shrink-0 lg:max-h-[calc(100vh-120px)] lg:rounded-xl lg:shadow-md lg:border lg:border-border lg:p-6 lg:z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 pb-2 border-b border-border">Cart</h3>
          
          {items.length === 0 ? (
            <div className="text-center text-text-muted py-6 lg:py-8">
              <p className="font-medium text-text-secondary">Your cart is empty</p>
              <p className="text-sm mt-2">Good food is always cooking! Go ahead, order some yummy items from the menu.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className={`w-3 h-3 border-2 rounded-[1px] flex items-center justify-center mb-1 ${item.isVeg ? 'border-success' : 'border-error'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-success' : 'bg-error'}`} />
                      </div>
                      <div className="text-sm font-medium text-text-primary mb-1 truncate">{item.name}</div>
                      <div className="text-sm text-text-secondary">₹{item.price}</div>
                    </div>
                    <div className="flex items-center border border-border rounded-sm h-[30px] shrink-0">
                      <button className="px-2 h-full text-success font-bold hover:bg-gray-100 flex items-center justify-center" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span className="px-2 text-sm font-medium">{item.quantity}</span>
                      <button className="px-2 h-full text-success font-bold hover:bg-gray-100 flex items-center justify-center" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-bold mt-6 pt-4 border-t border-dashed border-border mb-6">
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
      <div className="container mx-auto px-4 mt-12 mb-16">
        <h2 className="text-2xl font-bold mb-6 text-text-primary border-b border-border pb-2">Reviews ({restaurant.reviewCount || 0})</h2>
        {reviews.length === 0 ? (
          <p className="text-text-secondary">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-border">
                <div className="flex justify-between mb-4">
                  <div className="font-bold text-text-primary">{review.user_name}</div>
                  <div className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded text-sm font-bold">
                    <Star size={14} fill="currentColor" />
                    <span>{review.rating}</span>
                  </div>
                </div>
                <p className="text-text-secondary mb-3 leading-relaxed">{review.comment}</p>
                <div className="text-xs text-text-muted font-medium mb-2">
                  {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                
                {review.owner_reply && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md border-l-4 border-primary">
                    <div className="text-sm font-bold text-text-primary mb-1">Response from Owner</div>
                    <p className="text-sm text-text-secondary m-0">{review.owner_reply}</p>
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
