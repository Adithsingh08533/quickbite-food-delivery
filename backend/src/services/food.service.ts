import { foodRepository } from '../repositories/food.repository';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { AppError } from '../utils/AppError';
import { FoodItem, FoodItemWithCategory, CartItemWithDetails } from '../types';
import { CreateFoodItemDto, UpdateFoodItemDto, AddToCartDto } from '../validations';

export const foodService = {
  // ── Food Items ────────────────────────────────────────────────────
  async createFoodItem(
    restaurantId: string, ownerId: string, data: CreateFoodItemDto
  ): Promise<FoodItem> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to manage this restaurant', 403);
    }
    if (restaurant.approvalStatus !== 'approved') {
      throw new AppError('Restaurant must be approved before adding food items', 400);
    }

    return foodRepository.create({
      restaurantId,
      categoryId:  data.categoryId,
      name:        data.name,
      description: data.description,
      price:       data.price,
      isVeg:       data.isVeg ?? true,
      isFeatured:  data.isFeatured ?? false,
      prepTimeMin: data.prepTimeMin ?? 20,
    });
  },

  async getFoodItems(
    restaurantId: string, isVeg?: boolean
  ): Promise<FoodItemWithCategory[]> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    return foodRepository.findByRestaurant(restaurantId, {
      isAvailable: true,
      isVeg,
    });
  },

  async updateFoodItem(
    id: string, ownerId: string, data: UpdateFoodItemDto
  ): Promise<FoodItem> {
    const item = await foodRepository.findById(id);
    if (!item) throw new AppError('Food item not found', 404);

    const restaurant = await restaurantRepository.findById(item.restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to update this item', 403);
    }

    const updated = await foodRepository.update(id, data);
    if (!updated) throw new AppError('No changes made', 400);
    return updated;
  },

  async deleteFoodItem(id: string, ownerId: string): Promise<void> {
    const item = await foodRepository.findById(id);
    if (!item) throw new AppError('Food item not found', 404);

    const restaurant = await restaurantRepository.findById(item.restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to delete this item', 403);
    }

    await foodRepository.delete(id); // Soft delete
  },

  async updateFoodImage(id: string, ownerId: string, imageUrl: string): Promise<FoodItem> {
    const item = await foodRepository.findById(id);
    if (!item) throw new AppError('Food item not found', 404);

    const restaurant = await restaurantRepository.findById(item.restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to update this item', 403);
    }

    const updated = await foodRepository.update(id, { imageUrl });
    if (!updated) throw new AppError('Image update failed', 500);
    return updated;
  },

  // ── Cart ──────────────────────────────────────────────────────────
  async getCart(userId: string): Promise<{
    items: CartItemWithDetails[];
    subtotal: number;
    restaurantId: string | null;
  }> {
    const items = await foodRepository.getCartByUser(userId);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const restaurantId = items[0]?.restaurantId ?? null;
    return { items, subtotal, restaurantId };
  },

  async addToCart(userId: string, data: AddToCartDto): Promise<CartItemWithDetails> {
    const foodItem = await foodRepository.findById(data.foodItemId);
    if (!foodItem) throw new AppError('Food item not found', 404);
    if (!foodItem.isAvailable) throw new AppError('This item is currently unavailable', 400);

    const restaurant = await restaurantRepository.findById(foodItem.restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (!restaurant.isOpen) throw new AppError('Restaurant is currently closed', 400);
    if (restaurant.approvalStatus !== 'approved') {
      throw new AppError('Restaurant is not available', 400);
    }

    // Enforce single-restaurant cart policy
    const currentRestaurantId = await foodRepository.getCartRestaurantId(userId);
    if (currentRestaurantId && currentRestaurantId !== foodItem.restaurantId) {
      throw new AppError(
        'Your cart contains items from another restaurant. Clear your cart first.',
        409
      );
    }

    return foodRepository.addToCart({
      userId,
      foodItemId:   data.foodItemId,
      restaurantId: foodItem.restaurantId,
      quantity:     data.quantity,
    });
  },

  async updateCartItem(
    cartItemId: string, userId: string, quantity: number
  ): Promise<CartItemWithDetails> {
    const updated = await foodRepository.updateCartItem(cartItemId, userId, quantity);
    if (!updated) throw new AppError('Cart item not found', 404);
    return updated;
  },

  async removeFromCart(cartItemId: string, userId: string): Promise<void> {
    const removed = await foodRepository.removeFromCart(cartItemId, userId);
    if (!removed) throw new AppError('Cart item not found', 404);
  },

  async clearCart(userId: string): Promise<void> {
    await foodRepository.clearCart(userId);
  },
};
