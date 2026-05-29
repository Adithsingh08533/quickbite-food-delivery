import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { notificationRepository } from '../repositories/notification.repository';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

const router = Router();

router.use(authenticateJWT);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications for current user
 *     parameters:
 *       - { in: query, name: page,  schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Paginated notifications with unread count
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page  = parseInt(String(req.query.page  ?? 1), 10);
    const limit = parseInt(String(req.query.limit ?? 20), 10);

    const { notifications, total, unreadCount } = await notificationRepository.findByUser(
      req.user!.userId, { page, limit }
    );

    sendPaginated(
      Object.assign(res, {}), notifications, total, page, limit,
      `${unreadCount} unread notification(s)`
    );
  })
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 */
router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationRepository.markAllRead(req.user!.userId);
    sendSuccess(res, null, 'All notifications marked as read');
  })
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 */
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await notificationRepository.markOneRead(req.params.id!, req.user!.userId);
    sendSuccess(res, null, 'Notification marked as read');
  })
);

export default router;
