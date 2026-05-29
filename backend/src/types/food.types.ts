export interface FoodItem {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  prepTimeMin: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodItemWithCategory extends FoodItem {
  categoryName: string | null;
}

export interface CartItem {
  id: string;
  userId: string;
  foodItemId: string;
  restaurantId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemWithDetails extends CartItem {
  name: string;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  restaurantName: string;
}

// ─── DTOs ───────────────────────────────────────────────────────────

export interface CreateFoodItemDto {
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  isVeg?: boolean;
  isFeatured?: boolean;
  prepTimeMin?: number;
}

export interface UpdateFoodItemDto {
  categoryId?: string | null;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  prepTimeMin?: number;
}

export interface AddToCartDto {
  foodItemId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}
