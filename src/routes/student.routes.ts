import { Router } from 'express';
import StudentController from '../controllers/student.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', StudentController.create);
router.get('/', StudentController.getAll);
router.get('/:id', StudentController.getById);
router.get('/user/:userId', StudentController.getByUserId);
router.get('/parent/:parentId', StudentController.getByParent);
router.put('/:id', StudentController.update);

// Enrollment
router.post('/:id/enroll', StudentController.enrollInSubject);
router.put('/:id/enrollment/:enrollmentId', StudentController.updateEnrollmentStatus);

// Performance
router.get('/:id/performance', StudentController.getPerformance);
router.put('/:id/performance', StudentController.updatePerformance);

export default router;
