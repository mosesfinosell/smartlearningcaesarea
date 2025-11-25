import { Router } from 'express';
import ProgressReportController from '../controllers/progress.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', ProgressReportController.create);
router.get('/', ProgressReportController.getAll);
router.get('/student/:studentId', ProgressReportController.getByStudent);
router.get('/:id', ProgressReportController.getById);
router.post('/:id/send', ProgressReportController.sendToParent);
router.post('/:id/acknowledge', ProgressReportController.acknowledgeReport);

export default router;
