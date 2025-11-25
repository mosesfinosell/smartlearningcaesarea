import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  studentCode: string;
  academicInfo: {
    currentGrade: string;
    curriculum: 'US' | 'UK' | 'Nigeria';
    enrollmentDate: Date;
    expectedGraduation?: Date;
    previousSchool?: string;
  };
  enrolledSubjects: mongoose.Types.DocumentArray<
    mongoose.Types.Subdocument & {
      _id: mongoose.Types.ObjectId;
      subjectId: mongoose.Types.ObjectId;
      classId: mongoose.Types.ObjectId;
      tutorId: mongoose.Types.ObjectId;
      startDate: Date;
      status: 'active' | 'completed' | 'paused' | 'dropped';
      finalGrade?: string;
      completedAt?: Date;
    }
  >;
  performance: {
    overallGrade: number;
    overallPercentage: number;
    attendance: number;
    completedAssignments: number;
    totalAssignments: number;
    rank?: number;
    totalStudentsInGrade?: number;
  };
  specialNeeds?: string;
  learningStyle?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    studentCode: {
      type: String,
      unique: true,
    },
    academicInfo: {
      currentGrade: {
        type: String,
        required: true,
      },
      curriculum: {
        type: String,
        enum: ['US', 'UK', 'Nigeria'],
        required: true,
      },
      enrollmentDate: {
        type: Date,
        default: Date.now,
      },
      expectedGraduation: Date,
      previousSchool: String,
    },
    enrolledSubjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
        },
        classId: {
          type: Schema.Types.ObjectId,
          ref: 'Class',
        },
        tutorId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        startDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'paused', 'dropped'],
          default: 'active',
        },
        finalGrade: String,
        completedAt: Date,
      },
    ],
    performance: {
      overallGrade: {
        type: Number,
        default: 0,
      },
      overallPercentage: {
        type: Number,
        default: 0,
      },
      attendance: {
        type: Number,
        default: 100,
      },
      completedAssignments: {
        type: Number,
        default: 0,
      },
      totalAssignments: {
        type: Number,
        default: 0,
      },
      rank: Number,
      totalStudentsInGrade: Number,
    },
    specialNeeds: String,
    learningStyle: String,
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
studentSchema.index({ userId: 1 });
studentSchema.index({ parentId: 1 });
studentSchema.index({ studentCode: 1 });
studentSchema.index({ 'academicInfo.currentGrade': 1 });
studentSchema.index({ 'academicInfo.curriculum': 1 });

// Auto-generate student code
studentSchema.pre('save', async function (next) {
  if (!this.studentCode) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.studentCode = `STU${year}${randomNum}`;
  }
  next();
});

// Calculate overall grade when assignments are updated
studentSchema.methods.calculatePerformance = function () {
  if (this.performance.totalAssignments > 0) {
    this.performance.overallPercentage =
      (this.performance.completedAssignments / this.performance.totalAssignments) * 100;
  }
  return this.save();
};

export default mongoose.model<IStudent>('Student', studentSchema);
