import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';

export const Favorites = () => {
  const { wishlist, fetchWishlist, toggleWishlist, isLoading } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Please login to view your favorites</h2>
        <Button onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>Login</Button>
      </div>
    );
  }

  if (isLoading && wishlist.length === 0) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading favorites...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Favorites</h1>
      
      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <Heart size={48} color="var(--gray-300)" style={{ marginBottom: '1rem' }} />
          <h3>No favorites yet</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>Save your favorite food items to find them easily later!</p>
          <Button onClick={() => navigate('/')}>Explore Restaurants</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {wishlist.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>{item.restaurant_name}</div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>{item.name}</h3>
                  <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>₹{item.price}</div>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                  onClick={() => toggleWishlist(item.id)}
                  title="Remove from Wishlist"
                >
                  <Heart size={20} color="var(--error)" fill="var(--error)" />
                </button>
              </div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', margin: '0.75rem 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.description}
              </p>
              {/* Note: since this is just a quick page, adding to cart would require restaurantId, so we can just navigate to the restaurant */}
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                <Button variant="outline" fullWidth size="sm" onClick={() => navigate('/')}>
                  Find in Restaurants
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
