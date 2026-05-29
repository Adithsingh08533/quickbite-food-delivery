import crypto from 'crypto';
import Razorpay from 'razorpay';
import config from '../config/config';
import { orderRepository } from '../repositories/order.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { AppError } from '../utils/AppError';
import { Payment } from '../types';

const razorpay = new Razorpay({
  key_id:     config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export const paymentService = {
  /**
   * Creates a Razorpay order for the given QuickBite order.
   * Returns the razorpay_order_id needed by the frontend Razorpay SDK.
   */
  async createRazorpayOrder(orderId: string, userId: string): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId) throw new AppError('Access denied', 403);
    if (order.paymentMethod !== 'online') {
      throw new AppError('This order is set to Cash on Delivery', 400);
    }
    if (order.paymentStatus === 'paid') {
      throw new AppError('This order is already paid', 400);
    }

    // Amount in paise (INR × 100)
    const amountPaise = Math.round(order.totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  order.orderNumber,
      notes: {
        orderId:    order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Create/update payment record
    const existing = await paymentRepository.findByOrderId(orderId);
    if (!existing) {
      await paymentRepository.create({
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        currency: 'INR',
      });
    }

    return {
      razorpayOrderId: razorpayOrder.id,
      amount:          amountPaise,
      currency:        'INR',
      keyId:           config.razorpay.keyId,
    };
  },

  /**
   * Verifies Razorpay payment signature server-side (HMAC-SHA256).
   * This is the critical security step — never trust client-reported payment success.
   */
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    userId: string;
  }): Promise<Payment> {
    // Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== data.razorpaySignature) {
      throw new AppError('Payment signature verification failed. Possible fraud attempt.', 400);
    }

    // Find the payment record by Razorpay order ID
    const payment = await paymentRepository.findByRazorpayOrderId(data.razorpayOrderId);
    if (!payment) throw new AppError('Payment record not found', 404);

    // Verify the associated QuickBite order belongs to this user
    const order = await orderRepository.findById(payment.orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== data.userId) throw new AppError('Access denied', 403);

    // Update payment as paid
    const updatedPayment = await paymentRepository.updateAfterVerification({
      orderId:           payment.orderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      status:            'paid',
    });

    // Mark the order payment status as paid
    await orderRepository.updatePaymentStatus(payment.orderId, 'paid');

    return updatedPayment!;
  },
};
