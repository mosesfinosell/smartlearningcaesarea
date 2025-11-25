import mongoose, { Document, Schema } from 'mongoose';

export interface IParent extends Document {
  userId: mongoose.Types.ObjectId;
  parentCode: string;
  children: {
    studentId: mongoose.Types.ObjectId;
    relationship: 'father' | 'mother' | 'guardian' | 'other';
    isPrimaryContact: boolean;
  }[];
  occupation?: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  paymentInfo: {
    preferredPaymentMethod?: string;
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    savedCards?: {
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
      isDefault: boolean;
    }[];
  };
  wallet: {
    balance: number;
    currency: string;
    transactions: {
      type: 'credit' | 'debit';
      amount: number;
      description: string;
      date: Date;
      reference: string;
    }[];
  };
  notificationPreferences: {
    classReminders: boolean;
    progressReports: boolean;
    newsletters: boolean;
    promotions: boolean;
    paymentReminders: boolean;
  };
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
  addChild: (studentId: mongoose.Types.ObjectId, relationship: string) => Promise<IParent>;
  updateWallet: (
    type: 'credit' | 'debit',
    amount: number,
    description: string,
    reference: string
  ) => Promise<IParent>;
}

const parentSchema = new Schema<IParent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentCode: {
      type: String,
      unique: true,
    },
    children: [
      {
        studentId: {
          type: Schema.Types.ObjectId,
          ref: 'Student',
        },
        relationship: {
          type: String,
          enum: ['father', 'mother', 'guardian', 'other'],
          required: true,
        },
        isPrimaryContact: {
          type: Boolean,
          default: false,
        },
      },
    ],
    occupation: String,
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'email',
    },
    paymentInfo: {
      preferredPaymentMethod: String,
      billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
      savedCards: [
        {
          last4: String,
          brand: String,
          expiryMonth: Number,
          expiryYear: Number,
          isDefault: Boolean,
        },
      ],
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'NGN',
      },
      transactions: [
        {
          type: {
            type: String,
            enum: ['credit', 'debit'],
          },
          amount: Number,
          description: String,
          date: {
            type: Date,
            default: Date.now,
          },
          reference: String,
        },
      ],
    },
    notificationPreferences: {
      classReminders: {
        type: Boolean,
        default: true,
      },
      progressReports: {
        type: Boolean,
        default: true,
      },
      newsletters: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: false,
      },
      paymentReminders: {
        type: Boolean,
        default: true,
      },
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
parentSchema.index({ userId: 1 });
parentSchema.index({ parentCode: 1 });
parentSchema.index({ 'children.studentId': 1 });

// Auto-generate parent code
parentSchema.pre('save', async function (next) {
  if (!this.parentCode) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.parentCode = `PAR${year}${randomNum}`;
  }
  next();
});

// Add child to parent
parentSchema.methods.addChild = function (
  studentId: mongoose.Types.ObjectId,
  relationship: string
) {
  this.children.push({
    studentId,
    relationship,
    isPrimaryContact: this.children.length === 0,
  });
  return this.save();
};

// Update wallet balance
parentSchema.methods.updateWallet = function (
  type: 'credit' | 'debit',
  amount: number,
  description: string,
  reference: string
) {
  if (type === 'credit') {
    this.wallet.balance += amount;
  } else {
    this.wallet.balance -= amount;
  }

  this.wallet.transactions.push({
    type,
    amount,
    description,
    date: new Date(),
    reference,
  });

  return this.save();
};

export default mongoose.model<IParent>('Parent', parentSchema);
