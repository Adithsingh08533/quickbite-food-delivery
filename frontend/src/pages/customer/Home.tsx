import { useState, useEffect } from 'react';
import { Search, Map as MapIcon, List, Utensils } from 'lucide-react';
import { api } from '../../services/api';
import type { Restaurant } from '../../components/customer/RestaurantCard';
import { RestaurantCard } from '../../components/customer/RestaurantCard';
import { MapComponent } from '../../components/customer/MapComponent';

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
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary to-[#111827] text-white py-12 md:py-20 mb-8 md:mb-12 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">Hungry? We've got you covered.</h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">Discover the best food & drinks in your city</p>
          
          <div className="flex bg-white rounded-full p-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
            <Search className="text-text-muted my-auto ml-3 shrink-0" />
            <input 
              type="text" 
              className="flex-1 border-none bg-transparent px-4 text-base text-text-primary outline-none min-w-0" 
              placeholder="Search for restaurants, cuisines, or dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary rounded-full px-6 whitespace-nowrap">Search</button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-text-primary m-0">
            {debouncedSearch ? `Search results for "${debouncedSearch}"` : 'Top Restaurants Near You'}
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${!isMapView ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setIsMapView(false)}
            >
              <List size={16} /> List
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${isMapView ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setIsMapView(true)}
            >
              <MapIcon size={16} /> Map
            </button>
          </div>
        </div>
        
        {isMapView ? (
          <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-sm border border-border">
            <MapComponent userLocation={userLocation} restaurants={restaurants} />
          </div>
        ) : loading && restaurants.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="h-[300px] bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 animate-fade-in">
            <Utensils size={48} className="text-error mx-auto mb-4" />
            <h3 className="text-error text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-text-secondary">{error}</p>
            <button 
              className="btn btn-primary mt-4" 
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
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-16 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <Utensils size={48} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
            <p className="text-text-secondary">Try adjusting your search criteria</p>
          </div>
        )}
      </section>
    </div>
  );
};
