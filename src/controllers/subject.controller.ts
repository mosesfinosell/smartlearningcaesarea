import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Subject from '../models/Subject';

export class SubjectController {
  // Create a new subject
  static async create(req: AuthRequest, res: Response) {
    try {
      const subjectData = {
        ...req.body,
        createdBy: req.user?.userId,
      };

      const subject = new Subject(subjectData);
      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject,
      });
    } catch (error: any) {
      console.error('Create subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        error: error.message,
      });
    }
  }

  // Get all subjects with filtering
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { curriculum, category, gradeLevel, isActive, search } = req.query;

      const query: any = {};

      if (curriculum) query.curriculum = curriculum;
      if (category) query.category = category;
      if (gradeLevel) query.gradeLevel = gradeLevel;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const subjects = await Subject.find(query)
        .populate('createdBy', 'profile.firstName profile.lastName email')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: subjects,
        count: subjects.length,
      });
    } catch (error: any) {
      console.error('Get subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: error.message,
      });
    }
  }

  // Get subject by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const subject = await Subject.findById(req.params.id)
        .populate('createdBy', 'profile.firstName profile.lastName email');

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
      }

      res.json({
        success: true,
        data: subject,
      });
    } catch (error: any) {
      console.error('Get subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject',
        error: error.message,
      });
    }
  }

  // Update subject
  static async update(req: AuthRequest, res: Response) {
    try {
      const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
      }

      res.json({
        success: true,
        message: 'Subject updated successfully',
        data: subject,
      });
    } catch (error: any) {
      console.error('Update subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subject',
        error: error.message,
      });
    }
  }

  // Delete subject (soft delete by setting isActive to false)
  static async delete(req: AuthRequest, res: Response) {
    try {
      const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found',
        });
      }

      res.json({
        success: true,
        message: 'Subject deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subject',
        error: error.message,
      });
    }
  }

  // Get subjects by curriculum
  static async getByCurriculum(req: AuthRequest, res: Response) {
    try {
      const { curriculum } = req.params;
      
      const subjects = await Subject.find({
        curriculum: curriculum,
        isActive: true,
      }).sort({ category: 1, name: 1 });

      res.json({
        success: true,
        data: subjects,
        count: subjects.length,
      });
    } catch (error: any) {
      console.error('Get subjects by curriculum error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: error.message,
      });
    }
  }
}

export default SubjectController;
