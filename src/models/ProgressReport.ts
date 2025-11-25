import mongoose, { Document, Schema } from 'mongoose';

export interface IProgressReport extends Document {
  studentId: mongoose.Types.ObjectId;
  reportType: 'weekly' | 'monthly' | 'termly' | 'annual';
  period: {
    startDate: Date;
    endDate: Date;
    term?: string;
    year: number;
  };
  subjects: {
    subjectId: mongoose.Types.ObjectId;
    tutorId: mongoose.Types.ObjectId;
    classId: mongoose.Types.ObjectId;
    performance: {
      assignmentsCompleted: number;
      assignmentsTotal: number;
      averageScore: number;
      grade: string;
      attendance: number;
      participation: number;
    };
    tutorComments: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  }[];
  overallPerformance: {
    overallGrade: string;
    overallPercentage: number;
    overallAttendance: number;
    rank?: number;
    totalStudents?: number;
    improvement: number; // Percentage change from last report
  };
  behavioralAssessment: {
    punctuality: number; // 1-5
    participation: number;
    homework: number;
    conduct: number;
    comments: string;
  };
  skillsDevelopment: {
    criticalThinking: number; // 1-5
    problemSolving: number;
    communication: number;
    collaboration: number;
    creativity: number;
    timeManagement: number;
  };
  achievements: {
    title: string;
    description: string;
    date: Date;
    type: 'academic' | 'behavioral' | 'other';
  }[];
  areasOfConcern: {
    concern: string;
    severity: 'low' | 'medium' | 'high';
    actionRequired: string;
    deadline?: Date;
  }[];
  nextSteps: string[];
  parentMeeting: {
    scheduled: boolean;
    date?: Date;
    time?: string;
    location?: string;
    notes?: string;
  };
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  sentToParent: boolean;
  sentAt?: Date;
  parentAcknowledged: boolean;
  acknowledgedAt?: Date;
  parentFeedback?: string;
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  sendToParent: () => Promise<IProgressReport>;
  acknowledgeByParent: (feedback?: string) => Promise<IProgressReport>;
}

const progressReportSchema = new Schema<IProgressReport>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['weekly', 'monthly', 'termly', 'annual'],
      required: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      term: String,
      year: {
        type: Number,
        required: true,
      },
    },
    subjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
        },
        tutorId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        classId: {
          type: Schema.Types.ObjectId,
          ref: 'Class',
        },
        performance: {
          assignmentsCompleted: Number,
          assignmentsTotal: Number,
          averageScore: Number,
          grade: String,
          attendance: Number,
          participation: Number,
        },
        tutorComments: String,
        strengths: [String],
        areasForImprovement: [String],
        recommendations: [String],
      },
    ],
    overallPerformance: {
      overallGrade: String,
      overallPercentage: Number,
      overallAttendance: Number,
      rank: Number,
      totalStudents: Number,
      improvement: {
        type: Number,
        default: 0,
      },
    },
    behavioralAssessment: {
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      participation: {
        type: Number,
        min: 1,
        max: 5,
      },
      homework: {
        type: Number,
        min: 1,
        max: 5,
      },
      conduct: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: String,
    },
    skillsDevelopment: {
      criticalThinking: {
        type: Number,
        min: 1,
        max: 5,
      },
      problemSolving: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      collaboration: {
        type: Number,
        min: 1,
        max: 5,
      },
      creativity: {
        type: Number,
        min: 1,
        max: 5,
      },
      timeManagement: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    achievements: [
      {
        title: String,
        description: String,
        date: Date,
        type: {
          type: String,
          enum: ['academic', 'behavioral', 'other'],
        },
      },
    ],
    areasOfConcern: [
      {
        concern: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        actionRequired: String,
        deadline: Date,
      },
    ],
    nextSteps: [String],
    parentMeeting: {
      scheduled: {
        type: Boolean,
        default: false,
      },
      date: Date,
      time: String,
      location: String,
      notes: String,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    sentToParent: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
    parentAcknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: Date,
    parentFeedback: String,
    reportUrl: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
progressReportSchema.index({ studentId: 1, reportType: 1 });
progressReportSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
progressReportSchema.index({ sentToParent: 1 });
progressReportSchema.index({ parentAcknowledged: 1 });

// Send report to parent
progressReportSchema.methods.sendToParent = function () {
  this.sentToParent = true;
  this.sentAt = new Date();
  return this.save();
};

// Parent acknowledges report
progressReportSchema.methods.acknowledgeByParent = function (feedback?: string) {
  this.parentAcknowledged = true;
  this.acknowledgedAt = new Date();
  if (feedback) {
    this.parentFeedback = feedback;
  }
  return this.save();
};

export default mongoose.model<IProgressReport>('ProgressReport', progressReportSchema);
