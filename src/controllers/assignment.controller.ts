import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Assignment from '../models/Assignment';

export class AssignmentController {
  // Create assignment
  static async create(req: AuthRequest, res: Response) {
    try {
      const assignmentData = {
        ...req.body,
        tutorId:
          req.user?.role === 'tutor' ? req.user.userId : req.body.tutorId,
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create assignment',
        error: error.message,
      });
    }
  }

  // Get all assignments
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { classId, tutorId, type, isPublished } = req.query;
      const query: any = {};

      if (classId) query.classId = classId;
      if (tutorId) query.tutorId = tutorId;
      if (type) query.type = type;
      if (isPublished !== undefined) query.isPublished = isPublished === 'true';

      const assignments = await Assignment.find(query)
        .populate('tutorId', 'profile.firstName profile.lastName')
        .populate('subjectId', 'name code')
        .populate('classId', 'classCode')
        .sort({ dueDate: -1 });

      res.json({
        success: true,
        data: assignments,
        count: assignments.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignments',
        error: error.message,
      });
    }
  }

  // Get assignment by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const assignment = await Assignment.findById(req.params.id)
        .populate('tutorId', 'profile')
        .populate('subjectId', 'name code')
        .populate('submissions.studentId', 'profile studentCode');

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment',
        error: error.message,
      });
    }
  }

  // Submit assignment
  static async submit(req: AuthRequest, res: Response) {
    try {
      const { studentId, files, answers, textResponse } = req.body;
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      // Check if already submitted
      const existingSubmission = assignment.submissions.find(
        (s) => s.studentId.toString() === studentId
      );

      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: 'Assignment already submitted',
        });
      }

      const submission: any = {
        studentId,
        submittedAt: new Date(),
        files,
        answers,
        textResponse,
        status: assignment.isLateSubmission(new Date()) ? 'late' : 'submitted',
      };

      assignment.submissions.push(submission);
      await assignment.save();

      // Auto-grade if enabled
      if (assignment.settings.autoGrade) {
        const latestSubmission: any =
          assignment.submissions[assignment.submissions.length - 1];
        const submissionId = latestSubmission?._id?.toString();
        if (submissionId) {
          await assignment.autoGradeSubmission(submissionId);
        }
      }

      res.json({
        success: true,
        message: 'Assignment submitted successfully',
        data: assignment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit assignment',
        error: error.message,
      });
    }
  }

  // Grade submission
  static async gradeSubmission(req: AuthRequest, res: Response) {
    try {
      const { submissionId } = req.params;
      const { score, feedback } = req.body;

      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      const submission = assignment.submissions.id(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found',
        });
      }

      submission.score = score;
      submission.percentage = (score / assignment.maxScore) * 100;
      submission.grade = assignment.calculateGrade(submission.percentage);
      submission.feedback = feedback;
      submission.gradedBy = req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined;
      submission.gradedAt = new Date();
      submission.status = 'graded';

      await assignment.save();

      res.json({
        success: true,
        message: 'Assignment graded successfully',
        data: assignment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to grade assignment',
        error: error.message,
      });
    }
  }

  // Get student submissions
  static async getStudentSubmissions(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;

      const assignments = await Assignment.find({
        'submissions.studentId': studentId,
      }).populate('subjectId', 'name code');

      const submissions = assignments.map((assignment) => {
        const submission = assignment.submissions.find(
          (s) => s.studentId.toString() === studentId
        );
        return {
          assignment: {
            id: assignment._id,
            title: assignment.title,
            type: assignment.type,
            maxScore: assignment.maxScore,
            dueDate: assignment.dueDate,
          },
          submission,
        };
      });

      res.json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submissions',
        error: error.message,
      });
    }
  }

  // Publish assignment
  static async publish(req: AuthRequest, res: Response) {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      assignment.isPublished = true;
      assignment.publishedAt = new Date();
      await assignment.save();

      res.json({
        success: true,
        message: 'Assignment published successfully',
        data: assignment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish assignment',
        error: error.message,
      });
    }
  }
}

export default AssignmentController;
