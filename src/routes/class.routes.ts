import { Router } from 'express';
import ClassController from '../controllers/class.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Class CRUD
router.post('/', ClassController.create);
router.get('/', ClassController.getAll);
router.get('/:id', ClassController.getById);
router.put('/:id', ClassController.update);

// Enrollment
router.post('/:id/enroll', ClassController.enrollStudent);

// Sessions
router.post('/:id/sessions', ClassController.addSession);
router.put('/:id/sessions/:sessionId', ClassController.updateSession);
router.post('/:id/sessions/:sessionId/attendance', ClassController.markAttendance);

// Get by user
router.get('/student/:studentId', ClassController.getStudentClasses);
router.get('/tutor/:tutorId', ClassController.getTutorClasses);

export default router;
