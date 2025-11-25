import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  category: 'core' | 'optional' | 'advanced';
  curriculum: string[];
  gradeLevel: string[];
  description: string;
  syllabus: {
    topics: {
      week: number;
      title: string;
      description: string;
      learningObjectives: string[];
      resources: string[];
    }[];
  };
  pricing: {
    basePrice: number;
    currency: string;
    packagePrice?: number; // Price if bought with other subjects
  };
  icon?: string;
  color?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: ['core', 'optional', 'advanced'],
      default: 'core',
    },
    curriculum: {
      type: [String],
      enum: ['US', 'UK', 'Nigeria'],
      required: true,
    },
    gradeLevel: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    syllabus: {
      topics: [
        {
          week: Number,
          title: String,
          description: String,
          learningObjectives: [String],
          resources: [String],
        },
      ],
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'NGN',
      },
      packagePrice: Number,
    },
    icon: String,
    color: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subjectSchema.index({ code: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ curriculum: 1 });
subjectSchema.index({ isActive: 1 });

// Auto-generate code if not provided
subjectSchema.pre('save', function (next) {
  if (!this.code) {
    const shortName = this.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
    this.code = `${shortName}${Date.now().toString().slice(-4)}`;
  }
  next();
});

export default mongoose.model<ISubject>('Subject', subjectSchema);
