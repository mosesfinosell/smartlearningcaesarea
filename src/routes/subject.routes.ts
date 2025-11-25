import { Router } from 'express';
import SubjectController from '../controllers/subject.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', SubjectController.getAll);
router.get('/curriculum/:curriculum', SubjectController.getByCurriculum);
router.get('/:id', SubjectController.getById);

// Protected routes (admin/tutor)
router.post('/', authMiddleware, SubjectController.create);
router.put('/:id', authMiddleware, SubjectController.update);
router.delete('/:id', authMiddleware, SubjectController.delete);

export default router;
