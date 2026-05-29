import { orderRepository } from '../repositories/order.repository';
import { foodRepository } from '../repositories/food.repository';
import { restaurantRepository } from '../repositories/restaurant.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../utils/AppError';
import { generateOrderNumberFallback } from '../utils/generateOrderNumber';
import { OrderWithItems, OrderStatus } from '../types';
import { PlaceOrderDto, UpdateOrderStatusDto, OrderQueryDto } from '../validations';

// Valid status transitions — enforces the state machine
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['accepted', 'cancelled'],
  accepted:         ['preparing', 'cancelled'],
  preparing:        ['ready_for_pickup'],
  ready_for_pickup: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
};

export const orderService = {
  async placeOrder(userId: string, data: PlaceOrderDto): Promise<OrderWithItems> {
    // ── Validate delivery address ──────────────────────────────────
    const address = await userRepository.findAddressById(data.deliveryAddressId, userId);
    if (!address) throw new AppError('Delivery address not found', 404);

    // ── Validate cart ─────────────────────────────────────────────
    const cartItems = await foodRepository.getCartByUser(userId);
    if (cartItems.length === 0) throw new AppError('Your cart is empty', 400);

    const unavailable = cartItems.filter(i => !i.isAvailable);
    if (unavailable.length > 0) {
      throw new AppError(
        `Some items are no longer available: ${unavailable.map(i => i.name).join(', ')}`,
        400
      );
    }

    // ── Validate restaurant ───────────────────────────────────────
    const firstItem = cartItems[0];
    if (!firstItem) throw new AppError('Your cart is empty', 400);
    const restaurantId = firstItem.restaurantId;
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (!restaurant.isOpen) throw new AppError('Restaurant is currently closed', 400);

    // ── Calculate totals ──────────────────────────────────────────
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let discountAmount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const coupon = await orderRepository.findCouponByCode(data.couponCode);
      if (!coupon) throw new AppError('Invalid coupon code', 404);
      if (!coupon.isActive) throw new AppError('This coupon is no longer active', 400);
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new AppError('This coupon has expired', 400);
      }
      if (subtotal < coupon.minOrderAmount) {
        throw new AppError(
          `Minimum order of ₹${coupon.minOrderAmount} required for this coupon`, 400
        );
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new AppError('This coupon has reached its usage limit', 400);
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      } else {
        discountAmount = coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      couponId = coupon.id;
    }

    if (subtotal < restaurant.minOrderAmount) {
      throw new AppError(
        `Minimum order amount for this restaurant is ₹${restaurant.minOrderAmount}`, 400
      );
    }

    const deliveryFee = restaurant.deliveryFee;
    const totalAmount = subtotal - discountAmount + deliveryFee;
    const orderNumber = generateOrderNumberFallback();

    // ── Create order ──────────────────────────────────────────────
    const order = await orderRepository.create({
      orderNumber,
      userId,
      restaurantId,
      deliveryAddressId: address.id,
      couponId,
      paymentMethod: data.paymentMethod,
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      specialInstructions: data.specialInstructions,
      items: cartItems.map(ci => ({
        foodItemId:   ci.foodItemId,
        foodName:     ci.name,
        foodImageUrl: ci.imageUrl ?? undefined,
        unitPrice:    ci.price,
        quantity:     ci.quantity,
        totalPrice:   ci.price * ci.quantity,
        isVeg:        ci.isVeg,
      })),
    });

    // ── Post-order actions ────────────────────────────────────────
    await Promise.all([
      foodRepository.clearCart(userId),
      couponId ? orderRepository.incrementCouponUsage(couponId) : Promise.resolve(),
      notificationRepository.create({
        userId,
        type:  'order_placed',
        title: 'Order Placed Successfully!',
        body:  `Your order #${orderNumber} from ${restaurant.name} has been placed.`,
        data:  { orderId: order.id, orderNumber },
      }),
    ]);

    return order;
  },

  async getMyOrders(userId: string, query: OrderQueryDto): Promise<{
    orders: OrderWithItems[]; total: number;
  }> {
    return orderRepository.findByUser(userId, {
      status: query.status,
      page:   query.page,
      limit:  query.limit,
    });
  },

  async getRestaurantOrders(restaurantId: string, ownerId: string, query: OrderQueryDto): Promise<{
    orders: OrderWithItems[]; total: number;
  }> {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.ownerId !== ownerId) {
      throw new AppError('Access denied', 403);
    }

    return orderRepository.findByRestaurant(restaurantId, {
      status: query.status,
      page:   query.page,
      limit:  query.limit,
    });
  },

  async getOrderById(id: string, userId: string, role: string): Promise<OrderWithItems> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);

    // Customers can only see their own orders
    if (role === 'customer' && order.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Owners can only see orders for their restaurants
    if (role === 'owner') {
      const restaurant = await restaurantRepository.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        throw new AppError('Access denied', 403);
      }
    }

    return order;
  },

  async updateOrderStatus(
    id: string, actorId: string, role: string, data: UpdateOrderStatusDto
  ): Promise<OrderWithItems> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);

    // Permission checks
    if (role === 'owner') {
      const restaurant = await restaurantRepository.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId !== actorId) {
        throw new AppError('Access denied', 403);
      }
    }

    // Validate state machine transition
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(data.status as OrderStatus)) {
      throw new AppError(
        `Cannot transition from "${order.status}" to "${data.status}"`, 400
      );
    }

    // Customers cannot update status (except cancel via separate endpoint)
    if (role === 'customer') {
      throw new AppError('Customers cannot update order status', 403);
    }

    await orderRepository.updateStatus(id, data.status, {
      cancellationReason: data.cancellationReason,
    });

    // Send notification to customer
    const notifMap: Partial<Record<OrderStatus, { title: string; body: string }>> = {
      accepted:         { title: 'Order Accepted', body: `Your order #${order.orderNumber} has been accepted!` },
      preparing:        { title: 'Order Being Prepared', body: `${order.restaurantName} is preparing your order.` },
      ready_for_pickup: { title: 'Order Ready', body: 'Your order is ready for pickup by our delivery partner.' },
      out_for_delivery: { title: 'Out for Delivery', body: 'Your order is on its way!' },
      delivered:        { title: 'Order Delivered', body: `Enjoy your meal! Rate your experience.` },
      cancelled:        { title: 'Order Cancelled', body: `Your order #${order.orderNumber} was cancelled.` },
    };

    const notif = notifMap[data.status as OrderStatus];
    if (notif) {
      await notificationRepository.create({
        userId: order.userId,
        type:   `order_${data.status}`,
        title:  notif.title,
        body:   notif.body,
        data:   { orderId: id, orderNumber: order.orderNumber },
      });
    }

    const updated = await orderRepository.findById(id);
    if (!updated) throw new AppError('Order not found after update', 500);
    return updated;
  },

  async cancelOrder(id: string, userId: string, reason?: string): Promise<OrderWithItems> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId) throw new AppError('Access denied', 403);

    const cancellableStatuses: OrderStatus[] = ['pending', 'accepted'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    await orderRepository.updateStatus(id, 'cancelled', {
      cancellationReason: reason ?? 'Cancelled by customer',
    });

    const updated = await orderRepository.findById(id);
    if (!updated) throw new AppError('Order not found', 500);
    return updated;
  },
};
