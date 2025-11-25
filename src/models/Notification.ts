import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 
    | 'class-reminder'
    | 'assignment-due'
    | 'assignment-graded'
    | 'payment-due'
    | 'payment-received'
    | 'message-received'
    | 'report-available'
    | 'verification-update'
    | 'class-cancelled'
    | 'class-rescheduled'
    | 'enrollment-confirmed'
    | 'system-announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    classId?: mongoose.Types.ObjectId;
    assignmentId?: mongoose.Types.ObjectId;
    paymentId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    reportId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  status: {
    inApp: {
      sent: boolean;
      sentAt?: Date;
      read: boolean;
      readAt?: Date;
    };
    email: {
      sent: boolean;
      sentAt?: Date;
      opened: boolean;
      openedAt?: Date;
    };
    sms: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
    };
    push: {
      sent: boolean;
      sentAt?: Date;
      clicked: boolean;
      clickedAt?: Date;
    };
  };
  scheduledFor?: Date;
  expiresAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsRead: () => Promise<INotification>;
  markEmailOpened: () => Promise<INotification>;
  softDelete: () => Promise<INotification>;
  markAsSent: (channel: 'inApp' | 'email' | 'sms' | 'push') => Promise<INotification>;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'class-reminder',
        'assignment-due',
        'assignment-graded',
        'payment-due',
        'payment-received',
        'message-received',
        'report-available',
        'verification-update',
        'class-cancelled',
        'class-rescheduled',
        'enrollment-confirmed',
        'system-announcement',
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    actionUrl: String,
    actionText: String,
    metadata: {
      type: Schema.Types.Mixed,
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      inApp: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        read: {
          type: Boolean,
          default: false,
        },
        readAt: Date,
      },
      email: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        opened: {
          type: Boolean,
          default: false,
        },
        openedAt: Date,
      },
      sms: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
      },
      push: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        clicked: {
          type: Boolean,
          default: false,
        },
        clickedAt: Date,
      },
    },
    scheduledFor: Date,
    expiresAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, 'status.inApp.read': 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ deleted: 1 });

// Mark as read
notificationSchema.methods.markAsRead = function () {
  this.status.inApp.read = true;
  this.status.inApp.readAt = new Date();
  return this.save();
};

// Mark email as opened
notificationSchema.methods.markEmailOpened = function () {
  this.status.email.opened = true;
  this.status.email.openedAt = new Date();
  return this.save();
};

// Soft delete
notificationSchema.methods.softDelete = function () {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Mark as sent (for a specific channel)
notificationSchema.methods.markAsSent = function (
  channel: 'inApp' | 'email' | 'sms' | 'push'
) {
  this.status[channel].sent = true;
  this.status[channel].sentAt = new Date();
  return this.save();
};

export default mongoose.model<INotification>('Notification', notificationSchema);
