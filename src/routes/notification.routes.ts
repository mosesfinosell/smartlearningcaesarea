import { Router } from 'express';
import NotificationController from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', NotificationController.create);
router.get('/user/:userId', NotificationController.getUserNotifications);
router.get('/unread/:userId', NotificationController.getUnreadCount);
router.put('/:id/read', NotificationController.markAsRead);
router.put('/read-all/:userId', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.delete);

export default router;
