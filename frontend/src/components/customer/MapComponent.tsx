import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Restaurant } from './RestaurantCard';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet's default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user icon (blue)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom restaurant icon (red)
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically set map view
function SetViewOnClick({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

interface MapComponentProps {
  userLocation: [number, number] | null;
  restaurants: Restaurant[];
  defaultCenter?: [number, number];
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  userLocation, 
  restaurants,
  defaultCenter = [12.9716, 77.5946] // default to Bengaluru
}) => {
  const navigate = useNavigate();
  const center = userLocation || defaultCenter;

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {restaurants.map(restaurant => {
          if (restaurant.latitude && restaurant.longitude) {
            return (
              <Marker 
                key={restaurant.id} 
                position={[restaurant.latitude, restaurant.longitude]} 
                icon={restaurantIcon}
              >
                <Popup>
                  <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
                    <h3 style={{ margin: '0 0 5px 0' }}>{restaurant.name}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                      {restaurant.cuisineType}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                      ⭐ {restaurant.avgRating} ({restaurant.reviewCount})
                    </p>
                    {restaurant.distance && (
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>
                        {restaurant.distance.toFixed(2)} km away
                      </p>
                    )}
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>View Details &rarr;</span>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
        {userLocation && <SetViewOnClick coords={userLocation} />}
      </MapContainer>
    </div>
  );
};
