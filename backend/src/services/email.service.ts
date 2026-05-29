import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const emailService = {
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      await transporter.sendMail({
        from:    config.email.from,
        to,
        subject: 'Welcome to QuickBite! 🍔',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 12px; text-align: center; color: white; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px;">🍔 QuickBite</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">India's Fastest Food Delivery</p>
            </div>
            <h2 style="color: #1a1a1a;">Hey ${name}! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
              Welcome to QuickBite! Your account is ready. Browse hundreds of restaurants,
              discover your favorite cuisines, and get food delivered right to your door.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Use coupon code <strong style="color: #ff6b35;">WELCOME50</strong> for 50% off your first order!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.server.corsOrigin}" style="background: #ff6b35; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Order Now
              </a>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 40px;">
              © 2024 QuickBite. Made with ❤️ in India.
            </p>
          </div>
        `,
      });
    } catch (err) {
      // Email failure should never break the registration flow
      logger.error('Failed to send welcome email', { to, error: (err as Error).message });
    }
  },

  async sendOrderConfirmation(to: string, data: {
    name: string; orderNumber: string; restaurantName: string; totalAmount: number;
  }): Promise<void> {
    try {
      await transporter.sendMail({
        from:    config.email.from,
        to,
        subject: `Order Confirmed! #${data.orderNumber} 🎉`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1a1a1a;">Order Confirmed! ✅</h2>
            <p style="color: #555;">Hey ${data.name}, your order is confirmed.</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Order #:</strong> ${data.orderNumber}</p>
              <p style="margin: 4px 0;"><strong>Restaurant:</strong> ${data.restaurantName}</p>
              <p style="margin: 4px 0;"><strong>Total:</strong> ₹${data.totalAmount.toFixed(2)}</p>
            </div>
            <p style="color: #555;">We'll notify you as your order progresses!</p>
          </div>
        `,
      });
    } catch (err) {
      logger.error('Failed to send order confirmation email', {
        to, error: (err as Error).message,
      });
    }
  },
};
