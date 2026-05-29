import { Request, Response } from 'express';
import { foodService } from '../services/food.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { uploadToCloudinary } from '../middleware/upload.middleware';

export const foodController = {
  // ── Public ─────────────────────────────────────────────────────
  getFoodItems: asyncHandler(async (req: Request, res: Response) => {
    const isVeg = req.query.isVeg === 'true' ? true : req.query.isVeg === 'false' ? false : undefined;
    const items = await foodService.getFoodItems(req.params.restaurantId!, isVeg);
    sendSuccess(res, items, 'Food items retrieved');
  }),

  // ── Owner / Admin ───────────────────────────────────────────────
  createFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await foodService.createFoodItem(
      req.params.restaurantId!, req.user!.userId, req.body
    );
    sendCreated(res, item, 'Food item created');
  }),

  updateFoodItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await foodService.updateFoodItem(req.params.id!, req.user!.userId, req.body);
    sendSuccess(res, item, 'Food item updated');
  }),

  deleteFoodItem: asyncHandler(async (req: Request, res: Response) => {
    await foodService.deleteFoodItem(req.params.id!, req.user!.userId);
    sendSuccess(res, null, 'Food item removed from menu');
  }),

  uploadFoodImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new AppError('No image provided', 400);

    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'quickbite/food',
      `food-${req.params.id}`
    );

    const item = await foodService.updateFoodImage(req.params.id!, req.user!.userId, imageUrl);
    sendSuccess(res, item, 'Food item image updated');
  }),

  // ── Cart ────────────────────────────────────────────────────────
  getCart: asyncHandler(async (req: Request, res: Response) => {
    const cart = await foodService.getCart(req.user!.userId);
    sendSuccess(res, cart, 'Cart retrieved');
  }),

  addToCart: asyncHandler(async (req: Request, res: Response) => {
    const item = await foodService.addToCart(req.user!.userId, req.body);
    sendCreated(res, item, 'Item added to cart');
  }),

  updateCartItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await foodService.updateCartItem(
      req.params.id!, req.user!.userId, req.body.quantity
    );
    sendSuccess(res, item, 'Cart item updated');
  }),

  removeFromCart: asyncHandler(async (req: Request, res: Response) => {
    await foodService.removeFromCart(req.params.id!, req.user!.userId);
    sendSuccess(res, null, 'Item removed from cart');
  }),

  clearCart: asyncHandler(async (req: Request, res: Response) => {
    await foodService.clearCart(req.user!.userId);
    sendSuccess(res, null, 'Cart cleared');
  }),
};
