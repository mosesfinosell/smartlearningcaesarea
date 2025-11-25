import { Router } from 'express';
import AssignmentController from '../controllers/assignment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', AssignmentController.create);
router.get('/', AssignmentController.getAll);
router.get('/student/:studentId', AssignmentController.getStudentSubmissions);
router.get('/:id', AssignmentController.getById);

// Submissions
router.post('/:id/submit', AssignmentController.submit);
router.post('/:id/submissions/:submissionId/grade', AssignmentController.gradeSubmission);

// Publish
router.post('/:id/publish', AssignmentController.publish);

export default router;
