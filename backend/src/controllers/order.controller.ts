import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';

export const orderController = {
  placeOrder: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.placeOrder(req.user!.userId, req.body);
    sendCreated(res, order, 'Order placed successfully');
  }),

  getMyOrders: asyncHandler(async (req: Request, res: Response) => {
    const { orders, total } = await orderService.getMyOrders(
      req.user!.userId, req.query as never
    );
    const page  = parseInt(String(req.query.page  ?? 1), 10);
    const limit = parseInt(String(req.query.limit ?? 10), 10);
    sendPaginated(res, orders, total, page, limit, 'Orders retrieved');
  }),

  getRestaurantOrders: asyncHandler(async (req: Request, res: Response) => {
    const { orders, total } = await orderService.getRestaurantOrders(
      req.params.restaurantId!, req.user!.userId, req.query as never
    );
    const page  = parseInt(String(req.query.page  ?? 1), 10);
    const limit = parseInt(String(req.query.limit ?? 10), 10);
    sendPaginated(res, orders, total, page, limit, 'Orders retrieved');
  }),

  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(
      req.params.id!, req.user!.userId, req.user!.role
    );
    sendSuccess(res, order, 'Order retrieved');
  }),

  updateOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.updateOrderStatus(
      req.params.id!, req.user!.userId, req.user!.role, req.body
    );
    sendSuccess(res, order, 'Order status updated');
  }),

  cancelOrder: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.cancelOrder(
      req.params.id!, req.user!.userId, req.body.reason
    );
    sendSuccess(res, order, 'Order cancelled');
  }),
};
