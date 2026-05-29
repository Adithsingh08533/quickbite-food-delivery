import pool from '../database';
import { Payment } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPayment = (row: Record<string, any>): Payment => ({
  id:                   row.id,
  orderId:              row.order_id,
  razorpayOrderId:      row.razorpay_order_id,
  razorpayPaymentId:    row.razorpay_payment_id,
  razorpaySignature:    row.razorpay_signature,
  amount:               parseFloat(row.amount),
  currency:             row.currency,
  status:               row.status,
  failureReason:        row.failure_reason,
  createdAt:            row.created_at,
  updatedAt:            row.updated_at,
});

export const paymentRepository = {
  async create(data: {
    orderId: string; razorpayOrderId?: string; amount: number; currency?: string;
  }): Promise<Payment> {
    const result = await pool.query(
      `INSERT INTO payments (order_id, razorpay_order_id, amount, currency)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.orderId, data.razorpayOrderId ?? null, data.amount, data.currency ?? 'INR']
    );
    return mapPayment(result.rows[0]);
  },

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
    return result.rows[0] ? mapPayment(result.rows[0]) : null;
  },

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | null> {
    const result = await pool.query(
      'SELECT * FROM payments WHERE razorpay_order_id = $1',
      [razorpayOrderId]
    );
    return result.rows[0] ? mapPayment(result.rows[0]) : null;
  },

  async updateAfterVerification(data: {
    orderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    status: 'paid' | 'failed';
    failureReason?: string;
  }): Promise<Payment | null> {
    const result = await pool.query(
      `UPDATE payments
       SET razorpay_payment_id = $1, razorpay_signature = $2, status = $3, failure_reason = $4
       WHERE order_id = $5 RETURNING *`,
      [
        data.razorpayPaymentId, data.razorpaySignature, data.status,
        data.failureReason ?? null, data.orderId,
      ]
    );
    return result.rows[0] ? mapPayment(result.rows[0]) : null;
  },
};
