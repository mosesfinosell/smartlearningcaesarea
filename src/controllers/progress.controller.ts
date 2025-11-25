import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import ProgressReport from '../models/ProgressReport';

export class ProgressReportController {
  // Create progress report
  static async create(req: AuthRequest, res: Response) {
    try {
      const report = new ProgressReport({
        ...req.body,
        generatedBy: req.user?.userId,
      });
      await report.save();

      res.status(201).json({
        success: true,
        message: 'Progress report created successfully',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create progress report',
        error: error.message,
      });
    }
  }

  // Get report by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const report = await ProgressReport.findById(req.params.id)
        .populate('studentId', 'studentCode userId academicInfo')
        .populate('subjects.tutorId', 'profile')
        .populate('subjects.subjectId', 'name code')
        .populate('generatedBy', 'profile');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Progress report not found',
        });
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress report',
        error: error.message,
      });
    }
  }

  // Get reports by student
  static async getByStudent(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const { reportType, year } = req.query;

      const query: any = { studentId };

      if (reportType) query.reportType = reportType;
      if (year) query['period.year'] = parseInt(year as string);

      const reports = await ProgressReport.find(query)
        .populate('subjects.tutorId', 'profile')
        .populate('subjects.subjectId', 'name code')
        .sort({ 'period.endDate': -1 });

      res.json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress reports',
        error: error.message,
      });
    }
  }

  // Send report to parent
  static async sendToParent(req: AuthRequest, res: Response) {
    try {
      const report = await ProgressReport.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Progress report not found',
        });
      }

      await report.sendToParent();

      res.json({
        success: true,
        message: 'Report sent to parent successfully',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to send report',
        error: error.message,
      });
    }
  }

  // Parent acknowledges report
  static async acknowledgeReport(req: AuthRequest, res: Response) {
    try {
      const { feedback } = req.body;
      const report = await ProgressReport.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Progress report not found',
        });
      }

      await report.acknowledgeByParent(feedback);

      res.json({
        success: true,
        message: 'Report acknowledged successfully',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge report',
        error: error.message,
      });
    }
  }

  // Get all reports (admin)
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { reportType, year, sentToParent } = req.query;

      const query: any = {};

      if (reportType) query.reportType = reportType;
      if (year) query['period.year'] = parseInt(year as string);
      if (sentToParent !== undefined) query.sentToParent = sentToParent === 'true';

      const reports = await ProgressReport.find(query)
        .populate('studentId', 'studentCode userId')
        .populate('generatedBy', 'profile')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress reports',
        error: error.message,
      });
    }
  }
}

export default ProgressReportController;
