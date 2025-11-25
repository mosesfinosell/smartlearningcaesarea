import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Notification from '../models/Notification';

export class NotificationController {
  // Create notification
  static async create(req: AuthRequest, res: Response) {
    try {
      const notification = new Notification(req.body);
      await notification.save();

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message,
      });
    }
  }

  // Get user notifications
  static async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;
      const { read, type, priority } = req.query;

      const query: any = { userId, deleted: false };

      if (read !== undefined) query['status.inApp.read'] = read === 'true';
      if (type) query.type = type;
      if (priority) query.priority = priority;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: notifications,
        count: notifications.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  }

  // Mark as read
  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const notification = await Notification.findById(req.params.id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  }

  // Mark all as read
  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;

      await Notification.updateMany(
        { userId, 'status.inApp.read': false, deleted: false },
        {
          $set: {
            'status.inApp.read': true,
            'status.inApp.readAt': new Date(),
          },
        }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark all as read',
        error: error.message,
      });
    }
  }

  // Delete notification
  static async delete(req: AuthRequest, res: Response) {
    try {
      const notification = await Notification.findById(req.params.id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      await notification.softDelete();

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  }

  // Get unread count
  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;

      const count = await Notification.countDocuments({
        userId,
        'status.inApp.read': false,
        deleted: false,
      });

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message,
      });
    }
  }
}

export default NotificationController;
