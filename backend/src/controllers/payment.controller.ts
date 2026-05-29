import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const paymentController = {
  createRazorpayOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await paymentService.createRazorpayOrder(
      req.params.orderId!, req.user!.userId
    );
    sendCreated(res, data, 'Razorpay order created');
  }),

  verifyPayment: asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.verifyPayment({
      ...req.body,
      userId: req.user!.userId,
    });
    sendSuccess(res, payment, 'Payment verified successfully');
  }),
};
