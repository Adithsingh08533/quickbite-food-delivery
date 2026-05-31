import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, IndianRupee } from 'lucide-react';
import '../../pages/customer/Home.css';

export interface Restaurant {
  id: string;
  name: string;
  imageUrl?: string;
  avgRating: number;
  deliveryTimeMin: number;
  minOrderAmount: number;
  isOpen: boolean;
  cuisineType: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  reviewCount?: number;
}

interface Props {
  restaurant: Restaurant;
}

export const RestaurantCard: React.FC<Props> = ({ restaurant }) => {
  const { id, name, imageUrl, avgRating, deliveryTimeMin, minOrderAmount, isOpen, cuisineType, distance } = restaurant;
  
  const fallbackImage = '/images/restaurants/restaurant-1.jpg';
  
  const cuisinesList = cuisineType || 'Varied Cuisines';

  return (
    <Link to={`/restaurant/${id}`} className="restaurant-card">
      <div className="rc-image-wrapper">
        <img 
          src={imageUrl || fallbackImage} 
          alt={name} 
          className="rc-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        {!isOpen && (
          <div className="rc-closed-overlay">
            Currently Closed
          </div>
        )}
      </div>
      
      <div className="rc-content">
        <div className="rc-header">
          <h3 className="rc-name" title={name}>{name}</h3>
          <div className="rc-rating">
            <Star size={12} fill="currentColor" />
            <span>{Number(avgRating || 0).toFixed(1)}</span>
          </div>
        </div>
        
        <div className="rc-cuisines" title={cuisinesList}>
          {cuisinesList}
        </div>
        
        <div className="rc-footer">
          <div className="rc-meta">
            <Clock size={16} />
            <span>{deliveryTimeMin} mins</span>
          </div>
          <div className="rc-meta">
            <IndianRupee size={16} />
            <span>{minOrderAmount} for two</span>
          </div>
          {distance !== undefined && (
            <div className="rc-meta" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
              <span>{distance.toFixed(2)} km</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
