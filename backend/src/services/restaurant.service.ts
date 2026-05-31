import { restaurantRepository } from '../repositories/restaurant.repository';
import { AppError } from '../utils/AppError';
import { Restaurant, FoodCategory } from '../types';
import { RestaurantQueryDto, CreateRestaurantDto, UpdateRestaurantDto, CreateCategoryDto } from '../validations';

export const restaurantService = {
  async createRestaurant(ownerId: string, data: CreateRestaurantDto): Promise<Restaurant> {
    const restaurant = await restaurantRepository.create({
      ownerId,
      name: data.name,
      description: data.description,
      cuisineType: data.cuisineType,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state ?? 'Karnataka',
      pinCode: data.pinCode,
      deliveryFee: data.deliveryFee ?? 30,
      minOrderAmount: data.minOrderAmount ?? 100,
      deliveryTimeMin: data.deliveryTimeMin ?? 30,
      gstin: data.gstin,
      fssaiNumber: data.fssaiNumber,
    });
    return restaurant;
  },

  async getApprovedRestaurants(query: RestaurantQueryDto): Promise<{
    restaurants: Restaurant[]; total: number; page: number; limit: number;
  }> {
    const { restaurants, total } = await restaurantRepository.findAllApproved({
      city:         query.city,
      cuisineType:  query.cuisineType,
      search:       query.search,
      isOpen:       query.isOpen === 'true' ? true : query.isOpen === 'false' ? false : undefined,
      sortBy:       query.sortBy,
      page:         query.page,
      limit:        query.limit,
    });
    return { restaurants, total, page: query.page, limit: query.limit };
  },

  async getNearbyRestaurants(query: any): Promise<{
    restaurants: Restaurant[]; total: number; page: number; limit: number;
  }> {
    if (!query.lat || !query.lng || !query.radius) {
      throw new AppError('lat, lng, and radius are required', 400);
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 12;
    const { restaurants, total } = await restaurantRepository.findNearby({
      lat: parseFloat(query.lat),
      lng: parseFloat(query.lng),
      radius: parseFloat(query.radius),
      city:         query.city,
      cuisineType:  query.cuisineType,
      search:       query.search,
      isOpen:       query.isOpen === 'true' ? true : query.isOpen === 'false' ? false : undefined,
      sortBy:       query.sortBy,
      page,
      limit,
    });
    return { restaurants, total, page, limit };
  },

  async getRestaurantById(id: string): Promise<Restaurant> {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    return restaurant;
  },

  async getOwnerRestaurants(ownerId: string): Promise<Restaurant[]> {
    return restaurantRepository.findByOwnerId(ownerId);
  },

  async updateRestaurant(
    id: string, ownerId: string, role: string, data: UpdateRestaurantDto
  ): Promise<Restaurant> {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    // Owners can only update their own restaurants
    if (role === 'owner' && restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to update this restaurant', 403);
    }

    const updated = await restaurantRepository.update(id, data);
    if (!updated) throw new AppError('No changes were made', 400);
    return updated;
  },

  async toggleRestaurantOpen(id: string, ownerId: string): Promise<Restaurant> {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to update this restaurant', 403);
    }
    const updated = await restaurantRepository.update(id, { isOpen: !restaurant.isOpen });
    if (!updated) throw new AppError('Update failed', 500);
    return updated;
  },

  async updateRestaurantImage(id: string, ownerId: string, imageUrl: string): Promise<Restaurant> {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to update this restaurant', 403);
    }
    const updated = await restaurantRepository.update(id, { imageUrl });
    if (!updated) throw new AppError('Image update failed', 500);
    return updated;
  },

  // ── Categories ──────────────────────────────────────────────────
  async createCategory(restaurantId: string, ownerId: string, data: CreateCategoryDto): Promise<FoodCategory> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to manage this restaurant', 403);
    }
    return restaurantRepository.createCategory({
      restaurantId,
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder ?? 0,
    });
  },

  async getCategories(restaurantId: string): Promise<FoodCategory[]> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    return restaurantRepository.findCategoriesByRestaurant(restaurantId);
  },

  async deleteCategory(id: string, restaurantId: string, ownerId: string): Promise<void> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.ownerId !== ownerId) {
      throw new AppError('You do not have permission to manage this restaurant', 403);
    }
    const deleted = await restaurantRepository.deleteCategory(id, restaurantId);
    if (!deleted) throw new AppError('Category not found', 404);
  },
};
