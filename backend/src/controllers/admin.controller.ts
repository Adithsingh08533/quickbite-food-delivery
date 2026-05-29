import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export const adminController = {
  getRestaurants: asyncHandler(async (req: Request, res: Response) => {
    const page  = parseInt(String(req.query.page  ?? 1), 10);
    const limit = parseInt(String(req.query.limit ?? 10), 10);
    const approvalStatus = req.query.approvalStatus as string | undefined;

    const { restaurants, total } = await adminService.getAllRestaurants({
      approvalStatus, page, limit,
    });
    sendPaginated(res, restaurants, total, page, limit, 'Restaurants retrieved');
  }),

  approveRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await adminService.approveRestaurant(req.params.id!);
    sendSuccess(res, restaurant, 'Restaurant approved successfully');
  }),

  rejectRestaurant: asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.reason) throw new AppError('Rejection reason is required', 400);
    const restaurant = await adminService.rejectRestaurant(req.params.id!, req.body.reason);
    sendSuccess(res, restaurant, 'Restaurant rejected');
  }),

  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const page  = parseInt(String(req.query.page  ?? 1), 10);
    const limit = parseInt(String(req.query.limit ?? 20), 10);
    const role  = req.query.role as string | undefined;

    const { users, total } = await adminService.getAllUsers({ role, page, limit });
    sendPaginated(res, users, total, page, limit, 'Users retrieved');
  }),

  banUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.banUser(req.params.id!);
    sendSuccess(res, user, 'User banned and all sessions revoked');
  }),

  unbanUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.unbanUser(req.params.id!);
    sendSuccess(res, user, 'User unbanned');
  }),
};
