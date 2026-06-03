import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, IndianRupee } from 'lucide-react';

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
    <Link 
      to={`/restaurant/${id}`} 
      className="block bg-surface rounded-xl overflow-hidden shadow-sm border border-border transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
    >
      <div className="relative h-[180px] w-full bg-gray-200">
        <img 
          src={imageUrl || fallbackImage} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        {!isOpen && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center font-bold text-error text-xl">
            Currently Closed
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-text-primary m-0 whitespace-nowrap overflow-hidden text-ellipsis" title={name}>
            {name}
          </h3>
          <div className="flex items-center gap-1 bg-success text-white px-1.5 py-0.5 rounded text-xs font-bold shrink-0">
            <Star size={12} fill="currentColor" />
            <span>{Number(avgRating || 0).toFixed(1)}</span>
          </div>
        </div>
        
        <div className="text-text-secondary text-sm mb-4 whitespace-nowrap overflow-hidden text-ellipsis" title={cuisinesList}>
          {cuisinesList}
        </div>
        
        <div className="flex flex-wrap gap-y-2 justify-between items-center pt-4 border-t border-border text-text-secondary text-sm font-medium">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{deliveryTimeMin} mins</span>
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee size={16} />
            <span>{minOrderAmount} for two</span>
          </div>
          {distance !== undefined && (
            <div className="flex items-center gap-1 text-primary font-bold">
              <span>{distance.toFixed(2)} km</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
