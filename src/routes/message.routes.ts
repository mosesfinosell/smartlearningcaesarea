import { Router } from 'express';
import MessageController from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', MessageController.send);
router.get('/conversation/:userId1/:userId2', MessageController.getConversation);
router.get('/user/:userId', MessageController.getUserConversations);
router.get('/unread/:userId', MessageController.getUnreadCount);
router.put('/:id/read', MessageController.markAsRead);
router.delete('/:id', MessageController.delete);

export default router;
