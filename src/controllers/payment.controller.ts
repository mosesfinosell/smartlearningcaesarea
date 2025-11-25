import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Payment from '../models/Payment';
import Parent from '../models/Parent';
import PaystackService from '../services/paystack.service';

export class PaymentController {
  // Initialize payment
  static async initializePayment(req: AuthRequest, res: Response) {
    try {
      const { parentId, studentId, amount, paymentType, items, email } = req.body;

      // Generate payment reference
      const reference = PaystackService.generateReference();

      // Create payment record
      const payment = new Payment({
        parentId,
        studentId,
        amount,
        paymentType,
        items,
        paymentMethod: 'card',
        paystack: {
          reference,
        },
      });

      await payment.save();

      // Initialize Paystack transaction
      const paystackResponse = await PaystackService.initializeTransaction({
        email,
        amount: PaystackService.toKobo(amount),
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
        metadata: {
          paymentId: payment._id,
          studentId,
          parentId,
        },
      });

      if (!paystackResponse.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to initialize payment',
          error: paystackResponse.error,
        });
      }

      // Update payment with Paystack data
      payment.paystack.accessCode = paystackResponse.data.access_code;
      payment.paystack.authorizationUrl = paystackResponse.data.authorization_url;
      payment.status = 'processing';
      await payment.save();

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          paymentId: payment._id,
          reference,
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
        },
      });
    } catch (error: any) {
      console.error('Initialize payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment',
        error: error.message,
      });
    }
  }

  // Verify payment
  static async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { reference } = req.params;

      // Find payment
      const payment = await Payment.findOne({ 'paystack.reference': reference });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // Verify with Paystack
      const verifyResponse = await PaystackService.verifyTransaction(reference);

      if (verifyResponse.data.status === 'success') {
        // Update payment status
        await payment.markAsCompleted(verifyResponse.data);

        // Update parent wallet if it's a wallet top-up
        if (payment.paymentType === 'wallet-topup') {
          const parent = await Parent.findById(payment.parentId);
          if (parent) {
            await parent.updateWallet(
              'credit',
              payment.amount,
              'Wallet top-up',
              reference
            );
          }
        }

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            payment,
            transaction: verifyResponse.data,
          },
        });
      } else {
        payment.status = 'failed';
        await payment.save();

        res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          data: verifyResponse.data,
        });
      }
    } catch (error: any) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message,
      });
    }
  }

  // Get payment by ID
  static async getById(req: AuthRequest, res: Response) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('parentId', 'userId')
        .populate('studentId', 'userId studentCode')
        .populate('items.subjectId', 'name code')
        .populate('items.classId', 'classCode');

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment',
        error: error.message,
      });
    }
  }

  // Get payments by parent
  static async getByParent(req: AuthRequest, res: Response) {
    try {
      const { parentId } = req.params;
      const { status, paymentType } = req.query;

      const query: any = { parentId };

      if (status) query.status = status;
      if (paymentType) query.paymentType = paymentType;

      const payments = await Payment.find(query)
        .populate('studentId', 'userId studentCode')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: payments,
        count: payments.length,
      });
    } catch (error: any) {
      console.error('Get payments by parent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: error.message,
      });
    }
  }

  // Get all payments (admin)
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const { status, paymentType, startDate, endDate } = req.query;

      const query: any = {};

      if (status) query.status = status;
      if (paymentType) query.paymentType = paymentType;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const payments = await Payment.find(query)
        .populate('parentId', 'userId')
        .populate('studentId', 'userId studentCode')
        .sort({ createdAt: -1 });

      const totalAmount = payments.reduce((sum, payment) => {
        if (payment.status === 'completed') {
          return sum + payment.amount;
        }
        return sum;
      }, 0);

      res.json({
        success: true,
        data: payments,
        count: payments.length,
        totalAmount,
      });
    } catch (error: any) {
      console.error('Get all payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: error.message,
      });
    }
  }

  // Process refund
  static async processRefund(req: AuthRequest, res: Response) {
    try {
      const { reason, amount } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only completed payments can be refunded',
        });
      }

      // Process refund with Paystack
      const refundResponse = await PaystackService.processRefund(
        payment.paystack.reference,
        amount || payment.amount,
        reason
      );

      if (!refundResponse.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to process refund',
          error: refundResponse.error,
        });
      }

      // Update payment
      await payment.processRefund(
        amount || payment.amount,
        reason,
        refundResponse.data.transaction_reference
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: payment,
      });
    } catch (error: any) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error.message,
      });
    }
  }

  // Get payment statistics
  static async getStatistics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const query: any = { status: 'completed' };

      if (startDate || endDate) {
        query.paidAt = {};
        if (startDate) query.paidAt.$gte = new Date(startDate as string);
        if (endDate) query.paidAt.$lte = new Date(endDate as string);
      }

      const payments = await Payment.find(query);

      const stats = {
        totalPayments: payments.length,
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        byType: {} as Record<string, { count: number; amount: number }>,
        byMonth: {} as Record<string, { count: number; amount: number }>,
      };

      payments.forEach((payment) => {
        // By type
        if (!stats.byType[payment.paymentType]) {
          stats.byType[payment.paymentType] = { count: 0, amount: 0 };
        }
        stats.byType[payment.paymentType].count++;
        stats.byType[payment.paymentType].amount += payment.amount;

        // By month
        const month = payment.paidAt
          ? new Date(payment.paidAt).toISOString().slice(0, 7)
          : 'pending';
        if (!stats.byMonth[month]) {
          stats.byMonth[month] = { count: 0, amount: 0 };
        }
        stats.byMonth[month].count++;
        stats.byMonth[month].amount += payment.amount;
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message,
      });
    }
  }
}

export default PaymentController;
