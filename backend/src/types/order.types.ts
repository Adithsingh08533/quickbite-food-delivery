export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'online' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DiscountType = 'percentage' | 'flat';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  restaurantId: string;
  deliveryAddressId: string | null;
  couponId: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  specialInstructions: string | null;
  estimatedDeliveryAt: Date | null;
  placedAt: Date;
  acceptedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  otp: string | null;
  otpVerified: boolean;
  otpGeneratedAt: Date | null;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  foodItemId: string | null;
  foodName: string;
  foodImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isVeg: boolean;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  restaurantName: string;
  restaurantImageUrl: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

// ─── DTOs ───────────────────────────────────────────────────────────

export interface PlaceOrderDto {
  deliveryAddressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  specialInstructions?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  cancellationReason?: string;
}

export interface OrderFilterDto {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}
