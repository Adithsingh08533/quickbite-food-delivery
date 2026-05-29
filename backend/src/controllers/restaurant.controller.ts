import { Request, Response } from 'express';
import { restaurantService } from '../services/restaurant.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { uploadToCloudinary } from '../middleware/upload.middleware';
import { AppError } from '../utils/AppError';

export const restaurantController = {
  // ── Public ──────────────────────────────────────────────────────
  getRestaurants: asyncHandler(async (req: Request, res: Response) => {
    const { restaurants, total, page, limit } = await restaurantService.getApprovedRestaurants(
      req.query as never
    );
    sendPaginated(res, restaurants, total, page, limit, 'Restaurants retrieved');
  }),

  getRestaurantById: asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await restaurantService.getRestaurantById(req.params.id!);
    sendSuccess(res, restaurant, 'Restaurant retrieved');
  }),

  // ── Owner ───────────────────────────────────────────────────────
  createRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await restaurantService.createRestaurant(req.user!.userId, req.body);
    sendCreated(res, restaurant, 'Restaurant created. Pending admin approval.');
  }),

  getMyRestaurants: asyncHandler(async (req: Request, res: Response) => {
    const restaurants = await restaurantService.getOwnerRestaurants(req.user!.userId);
    sendSuccess(res, restaurants, 'Restaurants retrieved');
  }),

  updateRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id!, req.user!.userId, req.user!.role, req.body
    );
    sendSuccess(res, restaurant, 'Restaurant updated');
  }),

  toggleOpen: asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await restaurantService.toggleRestaurantOpen(
      req.params.id!, req.user!.userId
    );
    sendSuccess(res, restaurant, `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`);
  }),

  uploadRestaurantImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new AppError('No image provided', 400);

    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'quickbite/restaurants',
      `restaurant-${req.params.id}`
    );

    const restaurant = await restaurantService.updateRestaurantImage(
      req.params.id!, req.user!.userId, imageUrl
    );
    sendSuccess(res, restaurant, 'Restaurant image updated');
  }),

  // ── Categories ──────────────────────────────────────────────────
  getCategories: asyncHandler(async (req: Request, res: Response) => {
    const categories = await restaurantService.getCategories(req.params.restaurantId!);
    sendSuccess(res, categories, 'Categories retrieved');
  }),

  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await restaurantService.createCategory(
      req.params.restaurantId!, req.user!.userId, req.body
    );
    sendCreated(res, category, 'Category created');
  }),

  deleteCategory: asyncHandler(async (req: Request, res: Response) => {
    await restaurantService.deleteCategory(
      req.params.id!, req.params.restaurantId!, req.user!.userId
    );
    sendSuccess(res, null, 'Category deleted');
  }),
};
