import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Tutor, { ITutor } from '../models/Tutor';
import User from '../models/User';

export class TutorController {
  // Create tutor profile
  static async create(req: AuthRequest, res: Response) {
    try {
      const tutor = new Tutor(req.body);
      await tutor.save();

      res.status(201).json({
        success: true,
        message: 'Tutor profile created successfully',
        data: tutor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create tutor profile',
        error: error.message,
      });
    }
  }

  // Upload/display picture for tutor (passport-style)
  static async uploadPhoto(req: AuthRequest, res: Response) {
    try {
      const tutor = await Tutor.findById(req.params.id);

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor not found',
        });
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/tutors/${file.filename}`;

      tutor.photoUrl = fileUrl;
      await tutor.save();

      // Sync with linked user profile picture when available
      if (tutor.userId) {
        const user = await User.findById(tutor.userId);
        if (user) {
          user.profile.profilePicture = fileUrl;
          await user.save();
        }
      }

      res.json({
        success: true,
        message: 'Tutor photo uploaded successfully',
        data: { photoUrl: fileUrl },
      });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload tutor photo',
        error: error.message,
      });
    }
  }

  // Get tutor by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const tutor = await Tutor.findById(req.params.id)
        .populate('userId', 'email profile')
        .populate('expertise.subjectId', 'name code');

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor not found',
        });
      }

      res.json({
        success: true,
        data: tutor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tutor',
        error: error.message,
      });
    }
  }

  // Get tutor by user ID
  static async getByUserId(req: AuthRequest, res: Response) {
    try {
      const tutor = await Tutor.findOne({ userId: req.params.userId })
        .populate('userId', 'email profile')
        .populate('expertise.subjectId', 'name code');

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor profile not found',
        });
      }

      res.json({
        success: true,
        data: tutor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tutor',
        error: error.message,
      });
    }
  }

  // Update tutor profile
  static async update(req: AuthRequest, res: Response) {
    try {
      const tutor = await Tutor.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor not found',
        });
      }

      res.json({
        success: true,
        message: 'Tutor profile updated successfully',
        data: tutor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update tutor profile',
        error: error.message,
      });
    }
  }

  // Update verification stage
  static async updateVerificationStage(req: AuthRequest, res: Response) {
    try {
      const { stage, data } = req.body;
      const tutor = await Tutor.findById(req.params.id);

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor not found',
        });
      }

      const stageKey = stage as keyof ITutor['verificationStages'];
      if (!tutor.verificationStages[stageKey]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification stage',
        });
      }

      // Update specific verification stage
      Object.assign(tutor.verificationStages[stageKey], {
        ...data,
        reviewedBy: req.user?.userId,
        reviewedAt: new Date(),
      });

      await tutor.save();

      // Check if all stages are approved
      await tutor.checkVerificationComplete();

      res.json({
        success: true,
        message: 'Verification stage updated successfully',
        data: tutor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update verification stage',
        error: error.message,
      });
    }
  }

  // Update rating
  static async updateRating(req: AuthRequest, res: Response) {
    try {
      const { communication, punctuality, knowledge, patience } = req.body;
      const tutor = await Tutor.findById(req.params.id);

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor not found',
        });
      }

      await tutor.updateRating(communication, punctuality, knowledge, patience);

      res.json({
        success: true,
        message: 'Rating updated successfully',
        data: tutor.rating,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update rating',
        error: error.message,
      });
    }
  }

  // Get all tutors with filters
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { verificationStatus, isActive, subject, minRating } = req.query;

      const query: any = {};

      if (verificationStatus) query.overallVerificationStatus = verificationStatus;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (subject) query['expertise.subjectId'] = subject;
      if (minRating) query['rating.overall'] = { $gte: parseFloat(minRating as string) };

      const tutors = await Tutor.find(query)
        .populate('userId', 'email profile')
        .populate('expertise.subjectId', 'name code')
        .sort({ 'rating.overall': -1 });

      res.json({
        success: true,
        data: tutors,
        count: tutors.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tutors',
        error: error.message,
      });
    }
  }

  // Get tutors pending verification
  static async getPendingVerification(req: AuthRequest, res: Response) {
    try {
      const tutors = await Tutor.find({
        overallVerificationStatus: { $in: ['pending', 'in-progress'] },
      })
        .populate('userId', 'email profile')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: tutors,
        count: tutors.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending tutors',
        error: error.message,
      });
    }
  }
}

export default TutorController;
