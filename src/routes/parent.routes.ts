import { Router } from 'express';
import ParentController from '../controllers/parent.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', ParentController.create);
router.get('/', ParentController.getAll);
router.get('/user/:userId', ParentController.getByUserId);
router.get('/:id', ParentController.getById);
router.put('/:id', ParentController.update);

// Children
router.post('/:id/children', ParentController.addChild);

// Wallet
router.post('/:id/wallet', ParentController.updateWallet);
router.get('/:id/wallet/balance', ParentController.getWalletBalance);
router.get('/:id/wallet/transactions', ParentController.getWalletTransactions);

export default router;
