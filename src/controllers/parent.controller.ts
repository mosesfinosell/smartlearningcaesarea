import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Parent from '../models/Parent';

export class ParentController {
  // Create parent profile
  static async create(req: AuthRequest, res: Response) {
    try {
      const parent = new Parent(req.body);
      await parent.save();

      res.status(201).json({
        success: true,
        message: 'Parent profile created successfully',
        data: parent,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create parent profile',
        error: error.message,
      });
    }
  }

  // Get parent by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const parent = await Parent.findById(req.params.id)
        .populate('userId', 'email profile')
        .populate('children.studentId', 'studentCode userId academicInfo');

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found',
        });
      }

      res.json({
        success: true,
        data: parent,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch parent',
        error: error.message,
      });
    }
  }

  // Get parent by user ID
  static async getByUserId(req: AuthRequest, res: Response) {
    try {
      const parent = await Parent.findOne({ userId: req.params.userId })
        .populate('userId', 'email profile')
        .populate('children.studentId', 'studentCode userId academicInfo');

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent profile not found',
        });
      }

      res.json({
        success: true,
        data: parent,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch parent',
        error: error.message,
      });
    }
  }

  // Update parent profile
  static async update(req: AuthRequest, res: Response) {
    try {
      const parent = await Parent.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found',
        });
      }

      res.json({
        success: true,
        message: 'Parent profile updated successfully',
        data: parent,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update parent profile',
        error: error.message,
      });
    }
  }

  // Add child
  static async addChild(req: AuthRequest, res: Response) {
    try {
      const { studentId, relationship } = req.body;
      const parent = await Parent.findById(req.params.id);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found',
        });
      }

      await parent.addChild(studentId, relationship);

      res.json({
        success: true,
        message: 'Child added successfully',
        data: parent,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to add child',
        error: error.message,
      });
    }
  }

  // Update wallet
  static async updateWallet(req: AuthRequest, res: Response) {
    try {
      const { type, amount, description, reference } = req.body;
      const parent = await Parent.findById(req.params.id);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found',
        });
      }

      await parent.updateWallet(type, amount, description, reference);

      res.json({
        success: true,
        message: 'Wallet updated successfully',
        data: {
          balance: parent.wallet.balance,
          transaction: parent.wallet.transactions[parent.wallet.transactions.length - 1],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update wallet',
        error: error.message,
      });
    }
  }

  // Get wallet balance
  static async getWalletBalance(req: AuthRequest, res: Response) {
    try {
      const parent = await Parent.findById(req.params.id);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found',
        });
      }

      res.json({
        success: true,
        data: {
          balance: parent.wallet.balance,
          currency: parent.wallet.currency,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet balance',
        error: error.message,
      });
    }
  }

  // Get wallet transactions
  static async getWalletTransactions(req: AuthRequest, res: Response) {
    try {
      const parent = await Parent.findById(req.params.id);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found',
        });
      }

      res.json({
        success: true,
        data: parent.wallet.transactions.sort((a, b) => 
          b.date.getTime() - a.date.getTime()
        ),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message,
      });
    }
  }

  // Get all parents (admin)
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const parents = await Parent.find()
        .populate('userId', 'email profile')
        .populate('children.studentId', 'studentCode')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: parents,
        count: parents.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch parents',
        error: error.message,
      });
    }
  }
}

export default ParentController;
