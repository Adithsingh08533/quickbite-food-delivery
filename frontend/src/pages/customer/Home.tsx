import { useState, useEffect } from 'react';
import { Search, Map as MapIcon, List, Utensils } from 'lucide-react';
import { api } from '../../services/api';
import type { Restaurant } from '../../components/customer/RestaurantCard';
import { RestaurantCard } from '../../components/customer/RestaurantCard';
import { MapComponent } from '../../components/customer/MapComponent';
import './Home.css';

export const Home = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapView, setIsMapView] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get User Location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);

        let fetchedData = [];

        // 1. Try fetching nearby restaurants if we have location
        if (userLocation && !debouncedSearch) {
          const nearbyParams = new URLSearchParams(params);
          nearbyParams.append('lat', userLocation[0].toString());
          nearbyParams.append('lng', userLocation[1].toString());
          nearbyParams.append('radius', '15'); // 15 km radius

          const { data } = await api.get(`/restaurants/nearby?${nearbyParams.toString()}`);
          fetchedData = data.data || [];
        }

        // 2. If no location, or nearby returned 0 results, fallback to all approved restaurants
        if (!userLocation || (fetchedData.length === 0 && !debouncedSearch) || debouncedSearch) {
          const queryStr = params.toString();
          const { data } = await api.get(`/restaurants${queryStr ? `?${queryStr}` : ''}`);
          fetchedData = data.data || [];
        }

        setRestaurants(fetchedData);
      } catch (err: any) {
        console.error('Failed to fetch restaurants:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load restaurants.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [debouncedSearch, userLocation]);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content animate-fade-in">
          <h1 className="hero-title">Hungry? We've got you covered.</h1>
          <p className="hero-subtitle">Discover the best food & drinks in your city</p>
          
          <div className="search-bar">
            <Search color="var(--text-muted)" style={{ margin: 'auto 0 auto 10px' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search for restaurants, cuisines, or dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary search-btn">Search</button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            {debouncedSearch ? `Search results for "${debouncedSearch}"` : 'Top Restaurants Near You'}
          </h2>
          <div className="view-toggle">
            <button 
              className={`btn ${!isMapView ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsMapView(false)}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <List size={16} /> List
            </button>
            <button 
              className={`btn ${isMapView ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsMapView(true)}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}
            >
              <MapIcon size={16} /> Map
            </button>
          </div>
        </div>
        
        {isMapView ? (
          <MapComponent userLocation={userLocation} restaurants={restaurants} />
        ) : loading && restaurants.length === 0 ? (
          <div className="restaurant-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ height: '300px', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state animate-fade-in" style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Utensils size={48} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--error)' }}>Something went wrong</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '1rem' }} 
              onClick={() => {
                setLoading(true);
                setSearch(s => s + ' '); 
                setTimeout(() => setSearch(s => s.trim()), 0);
              }}
            >
              Try Again
            </button>
          </div>
        ) : restaurants.length > 0 ? (
          <div className="restaurant-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="empty-state animate-fade-in">
            <Utensils size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3>No restaurants found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </section>
    </div>
  );
};
