import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentCode: string;
  parentId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentType: 'registration' | 'subject-fee' | 'package-fee' | 'material-fee' | 'exam-fee' | 'wallet-topup';
  items: {
    description: string;
    subjectId?: mongoose.Types.ObjectId;
    classId?: mongoose.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  paymentMethod: 'card' | 'bank-transfer' | 'ussd' | 'mobile-money' | 'wallet';
  
  // Paystack specific fields
  paystack: {
    reference: string;
    accessCode?: string;
    authorizationUrl?: string;
    transactionId?: string;
    channel?: string;
    cardType?: string;
    last4?: string;
    bank?: string;
  };
  
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paidAt?: Date;
  
  refund?: {
    refunded: boolean;
    refundAmount: number;
    refundDate: Date;
    reason: string;
    refundReference: string;
  };
  
  invoice: {
    invoiceNumber: string;
    invoiceUrl?: string;
    sentAt?: Date;
  };
  
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  markAsCompleted: (transactionData: any) => Promise<IPayment>;
  processRefund: (refundAmount: number, reason: string, refundReference: string) => Promise<IPayment>;
}

const paymentSchema = new Schema<IPayment>(
  {
    paymentCode: {
      type: String,
      required: true,
      unique: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    paymentType: {
      type: String,
      enum: ['registration', 'subject-fee', 'package-fee', 'material-fee', 'exam-fee', 'wallet-topup'],
      required: true,
    },
    items: [
      {
        description: {
          type: String,
          required: true,
        },
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
        },
        classId: {
          type: Schema.Types.ObjectId,
          ref: 'Class',
        },
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    paymentMethod: {
      type: String,
      enum: ['card', 'bank-transfer', 'ussd', 'mobile-money', 'wallet'],
      required: true,
    },
    paystack: {
      reference: {
        type: String,
        required: true,
        unique: true,
      },
      accessCode: String,
      authorizationUrl: String,
      transactionId: String,
      channel: String,
      cardType: String,
      last4: String,
      bank: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paidAt: Date,
    refund: {
      refunded: {
        type: Boolean,
        default: false,
      },
      refundAmount: Number,
      refundDate: Date,
      reason: String,
      refundReference: String,
    },
    invoice: {
      invoiceNumber: {
        type: String,
        required: true,
      },
      invoiceUrl: String,
      sentAt: Date,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ parentId: 1 });
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paystack.reference': 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paymentType: 1 });

// Auto-generate payment code and invoice number
paymentSchema.pre('save', async function (next) {
  if (!this.paymentCode) {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.paymentCode = `PAY${year}${month}${randomNum}`;
  }

  if (!this.invoice.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.invoice.invoiceNumber = `INV${year}${month}${randomNum}`;
  }

  next();
});

// Mark payment as completed
paymentSchema.methods.markAsCompleted = function (transactionData: any) {
  this.status = 'completed';
  this.paidAt = new Date();
  this.paystack.transactionId = transactionData.id;
  this.paystack.channel = transactionData.channel;
  this.paystack.cardType = transactionData.authorization?.card_type;
  this.paystack.last4 = transactionData.authorization?.last4;
  this.paystack.bank = transactionData.authorization?.bank;
  return this.save();
};

// Process refund
paymentSchema.methods.processRefund = function (
  refundAmount: number,
  reason: string,
  refundReference: string
) {
  this.status = 'refunded';
  this.refund = {
    refunded: true,
    refundAmount,
    refundDate: new Date(),
    reason,
    refundReference,
  };
  return this.save();
};

export default mongoose.model<IPayment>('Payment', paymentSchema);
