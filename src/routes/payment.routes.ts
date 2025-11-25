import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/initialize', PaymentController.initializePayment);
router.get('/verify/:reference', PaymentController.verifyPayment);
router.get('/statistics', PaymentController.getStatistics);
router.get('/parent/:parentId', PaymentController.getByParent);
router.get('/:id', PaymentController.getById);
router.get('/', PaymentController.getAll);
router.post('/:id/refund', PaymentController.processRefund);

export default router;
