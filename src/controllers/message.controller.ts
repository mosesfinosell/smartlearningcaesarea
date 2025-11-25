import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Message from '../models/Message';

export class MessageController {
  // Send message
  static async send(req: AuthRequest, res: Response) {
    try {
      const { recipientId, content, attachments } = req.body;
      const senderId = req.user?.userId;
      const senderRole = req.user?.role;

      // Generate conversation ID
      const conversationId = (Message as any).generateConversationId(senderId, recipientId);

      const message = new Message({
        conversationId,
        senderId,
        senderRole,
        recipientId,
        recipientRole: req.body.recipientRole,
        content,
        attachments,
        isMonitored: senderRole === 'parent' || req.body.recipientRole === 'parent',
      });

      await message.save();

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  // Get conversation
  static async getConversation(req: AuthRequest, res: Response) {
    try {
      const { userId1, userId2 } = req.params;
      const conversationId = (Message as any).generateConversationId(userId1, userId2);

      const messages = await Message.find({
        conversationId,
        deleted: false,
      })
        .populate('senderId', 'profile.firstName profile.lastName profile.profilePicture')
        .populate('recipientId', 'profile.firstName profile.lastName profile.profilePicture')
        .sort({ createdAt: 1 });

      res.json({
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation',
        error: error.message,
      });
    }
  }

  // Get user conversations
  static async getUserConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;

      const messages = await Message.find({
        $or: [{ senderId: userId }, { recipientId: userId }],
        deleted: false,
      })
        .populate('senderId', 'profile')
        .populate('recipientId', 'profile')
        .sort({ createdAt: -1 });

      // Group by conversation and get latest message
      const conversationsMap = new Map();

      messages.forEach((msg) => {
        const otherUserId = msg.senderId.toString() === userId 
          ? msg.recipientId.toString()
          : msg.senderId.toString();

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            conversationId: msg.conversationId,
            otherUser: msg.senderId.toString() === userId ? msg.recipientId : msg.senderId,
            lastMessage: msg,
            unreadCount: 0,
          });
        }

        if (msg.recipientId.toString() === userId && !msg.read) {
          conversationsMap.get(otherUserId).unreadCount++;
        }
      });

      const conversations = Array.from(conversationsMap.values());

      res.json({
        success: true,
        data: conversations,
        count: conversations.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message,
      });
    }
  }

  // Mark as read
  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const message = await Message.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      await message.markAsRead();

      res.json({
        success: true,
        message: 'Message marked as read',
        data: message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark message as read',
        error: error.message,
      });
    }
  }

  // Delete message
  static async delete(req: AuthRequest, res: Response) {
    try {
      const message = await Message.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      await message.softDelete();

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: error.message,
      });
    }
  }

  // Get unread count
  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;

      const count = await Message.countDocuments({
        recipientId: userId,
        read: false,
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

export default MessageController;
