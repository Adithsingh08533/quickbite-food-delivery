export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  cuisineType: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  imageUrl: string | null;
  avgRating: number;
  reviewCount: number;
  deliveryFee: number;
  minOrderAmount: number;
  deliveryTimeMin: number;
  isOpen: boolean;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  gstin: string | null;
  fssaiNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodCategory {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── DTOs ───────────────────────────────────────────────────────────

export interface CreateRestaurantDto {
  name: string;
  description?: string;
  cuisineType: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pinCode: string;
  deliveryFee?: number;
  minOrderAmount?: number;
  deliveryTimeMin?: number;
  gstin?: string;
  fssaiNumber?: string;
}

export interface UpdateRestaurantDto {
  name?: string;
  description?: string;
  cuisineType?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  imageUrl?: string;
  deliveryFee?: number;
  minOrderAmount?: number;
  deliveryTimeMin?: number;
  gstin?: string;
  fssaiNumber?: string;
}

export interface RestaurantFilterDto {
  city?: string;
  cuisineType?: string;
  search?: string;
  isVeg?: boolean;
  isOpen?: boolean;
  sortBy?: 'rating' | 'deliveryTime' | 'deliveryFee';
  page?: number;
  limit?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  displayOrder?: number;
}
