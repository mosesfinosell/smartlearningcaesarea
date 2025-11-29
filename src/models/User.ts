import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'parent' | 'student' | 'tutor' | 'admin' | 'coordinator';
  provider?: 'local' | 'google' | 'facebook' | 'apple';
  providerId?: string;
  profileComplete?: boolean;
  refreshToken?: string;
  profile: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    phoneNumber?: string;
    whatsappNumber?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    timezone?: string;
    profilePicture?: string;
    language?: string[];
  };
  status: 'active' | 'suspended' | 'inactive' | 'pending';
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === 'local';
      },
      minlength: [
        8,
        'Password must be at least 8 characters long',
      ],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['parent', 'student', 'tutor', 'admin', 'coordinator'],
      required: [true, 'Role is required'],
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'apple'],
      default: 'local',
    },
    providerId: {
      type: String,
      trim: true,
    },
    profileComplete: {
      type: Boolean,
      default: true,
    },
    refreshToken: String,
    profile: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
      },
      middleName: {
        type: String,
        trim: true,
      },
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      whatsappNumber: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
      timezone: {
        type: String,
        default: 'Africa/Lagos',
      },
      profilePicture: String,
      language: [String],
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive', 'pending'],
      default: 'active',
    },
    verification: {
      emailVerified: {
        type: Boolean,
        default: false,
      },
      phoneVerified: {
        type: Boolean,
        default: false,
      },
      identityVerified: {
        type: Boolean,
        default: false,
      },
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password if it exists and has been modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
  delete (ret as any).password;
  delete (ret as any).__v;
    return ret;
  },
});

export default mongoose.model<IUser>('User', userSchema);
