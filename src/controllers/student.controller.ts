import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Student from '../models/Student';
import Parent from '../models/Parent';

export class StudentController {
  // Create student profile
  static async create(req: AuthRequest, res: Response) {
    try {
      const { userId, parentId, academicInfo, emergencyContact } = req.body;

      const student = new Student({
        userId,
        parentId,
        academicInfo,
        emergencyContact,
      });

      await student.save();

      // Add student to parent's children list
      const parent = await Parent.findById(parentId);
      if (parent) {
        await parent.addChild(student._id, 'child');
      }

      res.status(201).json({
        success: true,
        message: 'Student profile created successfully',
        data: student,
      });
    } catch (error: any) {
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create student profile',
        error: error.message,
      });
    }
  }

  // Get student by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const student = await Student.findById(req.params.id)
        .populate('userId', 'email profile')
        .populate('parentId', 'userId')
        .populate('enrolledSubjects.subjectId', 'name code')
        .populate('enrolledSubjects.tutorId', 'profile.firstName profile.lastName');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      console.error('Get student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student',
        error: error.message,
      });
    }
  }

  // Get student by user ID
  static async getByUserId(req: AuthRequest, res: Response) {
    try {
      const student = await Student.findOne({ userId: req.params.userId })
        .populate('userId', 'email profile')
        .populate('parentId')
        .populate('enrolledSubjects.subjectId', 'name code')
        .populate('enrolledSubjects.tutorId', 'profile.firstName profile.lastName');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found',
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      console.error('Get student by user ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student',
        error: error.message,
      });
    }
  }

  // Update student profile
  static async update(req: AuthRequest, res: Response) {
    try {
      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      res.json({
        success: true,
        message: 'Student profile updated successfully',
        data: student,
      });
    } catch (error: any) {
      console.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student profile',
        error: error.message,
      });
    }
  }

  // Enroll student in subject
  static async enrollInSubject(req: AuthRequest, res: Response) {
    try {
      const { subjectId, classId, tutorId } = req.body;
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      // Check if already enrolled
      const alreadyEnrolled = student.enrolledSubjects.some(
        (sub) => sub.subjectId.toString() === subjectId && sub.status === 'active'
      );

      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'Student already enrolled in this subject',
        });
      }

      student.enrolledSubjects.push({
        subjectId,
        classId,
        tutorId,
        startDate: new Date(),
        status: 'active',
      });

      await student.save();

      res.json({
        success: true,
        message: 'Student enrolled in subject successfully',
        data: student,
      });
    } catch (error: any) {
      console.error('Enroll in subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll student',
        error: error.message,
      });
    }
  }

  // Update enrollment status
  static async updateEnrollmentStatus(req: AuthRequest, res: Response) {
    try {
      const { enrollmentId } = req.params;
      const { status, finalGrade } = req.body;

      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      const enrollment = student.enrolledSubjects.id(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found',
        });
      }

      enrollment.status = status;
      if (finalGrade) enrollment.finalGrade = finalGrade;
      if (status === 'completed') enrollment.completedAt = new Date();

      await student.save();

      res.json({
        success: true,
        message: 'Enrollment status updated successfully',
        data: student,
      });
    } catch (error: any) {
      console.error('Update enrollment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update enrollment status',
        error: error.message,
      });
    }
  }

  // Get student performance
  static async getPerformance(req: AuthRequest, res: Response) {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      res.json({
        success: true,
        data: {
          studentCode: student.studentCode,
          performance: student.performance,
          enrolledSubjects: student.enrolledSubjects.length,
          activeSubjects: student.enrolledSubjects.filter((s) => s.status === 'active').length,
        },
      });
    } catch (error: any) {
      console.error('Get performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance',
        error: error.message,
      });
    }
  }

  // Update performance metrics
  static async updatePerformance(req: AuthRequest, res: Response) {
    try {
      const { performance } = req.body;
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      Object.assign(student.performance, performance);
      await student.save();

      res.json({
        success: true,
        message: 'Performance updated successfully',
        data: student.performance,
      });
    } catch (error: any) {
      console.error('Update performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update performance',
        error: error.message,
      });
    }
  }

  // Get students by parent
  static async getByParent(req: AuthRequest, res: Response) {
    try {
      const students = await Student.find({ parentId: req.params.parentId })
        .populate('userId', 'email profile')
        .populate('enrolledSubjects.subjectId', 'name code')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: students,
        count: students.length,
      });
    } catch (error: any) {
      console.error('Get students by parent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error.message,
      });
    }
  }

  // Get all students (admin)
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { grade, curriculum, status, search } = req.query;

      const query: any = {};

      if (grade) query['academicInfo.currentGrade'] = grade;
      if (curriculum) query['academicInfo.curriculum'] = curriculum;
      if (search) {
        query.$or = [
          { studentCode: { $regex: search, $options: 'i' } },
        ];
      }

      const students = await Student.find(query)
        .populate('userId', 'email profile')
        .populate('parentId', 'userId')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: students,
        count: students.length,
      });
    } catch (error: any) {
      console.error('Get all students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error.message,
      });
    }
  }
}

export default StudentController;
