import { Router } from 'express';
import TutorController from '../controllers/tutor.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tutorPhotoUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', TutorController.create);
router.get('/', TutorController.getAll);
router.get('/pending-verification', TutorController.getPendingVerification);
router.get('/:id', TutorController.getById);
router.get('/user/:userId', TutorController.getByUserId);
router.put('/:id', TutorController.update);
router.post('/:id/photo', tutorPhotoUpload.single('photo'), TutorController.uploadPhoto);

// Verification
router.put('/:id/verification', TutorController.updateVerificationStage);

// Rating
router.post('/:id/rating', TutorController.updateRating);

export default router;
