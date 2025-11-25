import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Class from '../models/Class';
import { GoogleCalendarService } from '../services/calendar.service';

export class ClassController {
  // Create a new class
  static async create(req: AuthRequest, res: Response) {
    try {
      const classData = {
        ...req.body,
        tutorId:
          req.user?.role === 'tutor' ? req.user.userId : req.body.tutorId,
      };

      const newClass = new Class(classData);
      await newClass.save();

      // Generate calendar links for students if schedule exists
      if (newClass.schedule) {
        const startDate = new Date(newClass.schedule.startDate);
        const endDate = newClass.schedule.endDate
          ? new Date(newClass.schedule.endDate)
          : startDate;

        const calendarEvent = {
          title: `${newClass.subjectId} - Live Class`,
          description: `Join class: ${newClass.sessions[0]?.zoomMeetingLink || 'Link TBA'}`,
          startTime: startDate,
          endTime: endDate,
          location: newClass.sessions[0]?.zoomMeetingLink || '',
          timezone: newClass.schedule.timezone || 'Africa/Lagos',
          attendees: [],
        };

        const calendarLink = GoogleCalendarService.generateCalendarLink(calendarEvent);
        // Store calendar link in first session if exists
        if (newClass.sessions.length > 0) {
          newClass.sessions[0].googleCalendarLink = calendarLink;
          await newClass.save();
        }
      }

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: newClass,
      });
    } catch (error: any) {
      console.error('Create class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create class',
        error: error.message,
      });
    }
  }

  // Get all classes with filters
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { tutorId, subjectId, type, curriculum, isActive, search } = req.query;

      const query: any = {};

      if (tutorId) query.tutorId = tutorId;
      if (subjectId) query.subjectId = subjectId;
      if (type) query.type = type;
      if (curriculum) query.curriculum = curriculum;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { classCode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const classes = await Class.find(query)
        .populate('tutorId', 'profile.firstName profile.lastName email')
        .populate('subjectId', 'name code')
        .populate('students.studentId', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: classes,
        count: classes.length,
      });
    } catch (error: any) {
      console.error('Get classes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch classes',
        error: error.message,
      });
    }
  }

  // Get class by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const classData = await Class.findById(req.params.id)
        .populate('tutorId', 'profile.firstName profile.lastName email profile.profilePicture')
        .populate('subjectId', 'name code description')
        .populate('students.studentId', 'profile.firstName profile.lastName profile.profilePicture');

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      res.json({
        success: true,
        data: classData,
      });
    } catch (error: any) {
      console.error('Get class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class',
        error: error.message,
      });
    }
  }

  // Update class
  static async update(req: AuthRequest, res: Response) {
    try {
      const classData = await Class.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      res.json({
        success: true,
        message: 'Class updated successfully',
        data: classData,
      });
    } catch (error: any) {
      console.error('Update class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update class',
        error: error.message,
      });
    }
  }

  // Enroll student in class
  static async enrollStudent(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.body;
      const classData = await Class.findById(req.params.id);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      // Check if student is already enrolled
      const alreadyEnrolled = classData.students.some(
        (s) => s.studentId.toString() === studentId
      );

      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'Student already enrolled in this class',
        });
      }

      // Check if class is full
      if (classData.maxStudents && classData.currentEnrollment >= classData.maxStudents) {
        return res.status(400).json({
          success: false,
          message: 'Class is full',
        });
      }

      // Enroll student
      classData.students.push({
        studentId,
        enrollmentDate: new Date(),
        status: 'active',
      });

      await classData.updateEnrollment();

      res.json({
        success: true,
        message: 'Student enrolled successfully',
        data: classData,
      });
    } catch (error: any) {
      console.error('Enroll student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll student',
        error: error.message,
      });
    }
  }

  // Add session to class
  static async addSession(req: AuthRequest, res: Response) {
    try {
      const classData = await Class.findById(req.params.id);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      const sessionData = {
        ...req.body,
        sessionNumber: classData.sessions.length + 1,
      };

      // Generate calendar link for this session
      if (sessionData.sessionDate && sessionData.zoomMeetingLink) {
        const calendarEvent = {
          title: `Session ${sessionData.sessionNumber} - ${sessionData.topic || 'Class'}`,
          description: `Join class: ${sessionData.zoomMeetingLink}`,
          startTime: new Date(sessionData.sessionDate),
          endTime: new Date(new Date(sessionData.sessionDate).getTime() + 60 * 60 * 1000), // 1 hour
          location: sessionData.zoomMeetingLink,
          timezone: classData.schedule?.timezone || 'Africa/Lagos',
          attendees: [],
        };

        sessionData.googleCalendarLink = GoogleCalendarService.generateCalendarLink(calendarEvent);
      }

      classData.sessions.push(sessionData);
      await classData.save();

      res.json({
        success: true,
        message: 'Session added successfully',
        data: classData,
      });
    } catch (error: any) {
      console.error('Add session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add session',
        error: error.message,
      });
    }
  }

  // Update session
  static async updateSession(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const classData = await Class.findById(req.params.id);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      const session = (classData.sessions as any).id(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      // Update session fields
      Object.assign(session, req.body);
      await classData.save();

      res.json({
        success: true,
        message: 'Session updated successfully',
        data: classData,
      });
    } catch (error: any) {
      console.error('Update session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update session',
        error: error.message,
      });
    }
  }

  // Mark attendance
  static async markAttendance(req: AuthRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const { attendance } = req.body; // Array of { studentId, present, joinTime, leaveTime }

      const classData = await Class.findById(req.params.id);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: 'Class not found',
        });
      }

      const session = (classData.sessions as any).id(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      session.attendance = attendance;
      session.status = 'completed';
      await classData.save();

      res.json({
        success: true,
        message: 'Attendance marked successfully',
        data: classData,
      });
    } catch (error: any) {
      console.error('Mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark attendance',
        error: error.message,
      });
    }
  }

  // Get classes for a student
  static async getStudentClasses(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;

      const classes = await Class.find({
        'students.studentId': studentId,
        'students.status': 'active',
        isActive: true,
      })
        .populate('tutorId', 'profile.firstName profile.lastName profile.profilePicture')
        .populate('subjectId', 'name code')
        .sort({ 'schedule.startTime': 1 });

      res.json({
        success: true,
        data: classes,
        count: classes.length,
      });
    } catch (error: any) {
      console.error('Get student classes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student classes',
        error: error.message,
      });
    }
  }

  // Get classes for a tutor
  static async getTutorClasses(req: AuthRequest, res: Response) {
    try {
      const tutorId =
        req.user?.role === 'tutor' ? req.user.userId : req.params.tutorId;

      const classes = await Class.find({
        tutorId,
        isActive: true,
      })
        .populate('subjectId', 'name code')
        .populate('students.studentId', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: classes,
        count: classes.length,
      });
    } catch (error: any) {
      console.error('Get tutor classes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tutor classes',
        error: error.message,
      });
    }
  }
}

export default ClassController;
