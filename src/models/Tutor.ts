import mongoose, { Document, Schema } from 'mongoose';

export interface ITutor extends Document {
  userId: mongoose.Types.ObjectId;
  tutorCode: string;
  photoUrl?: string;
  qualifications: {
    degree: string;
    institution: string;
    graduationYear: number;
    major: string;
    certificationUrl?: string;
  }[];
  expertise: {
    subjectId: mongoose.Types.ObjectId;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    certifications: string[];
  }[];
  experience: {
    title: string;
    institution: string;
    startDate: Date;
    endDate?: Date;
    description: string;
    isCurrent: boolean;
  }[];
  verificationStages: {
    stage1_certificationVerification: {
      status: 'pending' | 'in-review' | 'approved' | 'rejected';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      documents: {
        fileName: string;
        fileUrl: string;
        fileType: string;
      }[];
      notes?: string;
    };
    stage2_experienceVerification: {
      status: 'pending' | 'in-review' | 'approved' | 'rejected';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      references: {
        name: string;
        position: string;
        institution: string;
        email: string;
        phone: string;
        verified: boolean;
      }[];
      notes?: string;
    };
    stage3_demoVideo: {
      status: 'pending' | 'in-review' | 'approved' | 'rejected';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      videoUrl?: string;
      duration?: number;
      topic?: string;
      rating?: number;
      feedback?: string;
      notes?: string;
    };
    stage4_ethicsReview: {
      status: 'pending' | 'in-review' | 'approved' | 'rejected';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      backgroundCheckCompleted: boolean;
      backgroundCheckUrl?: string;
      policeClearance?: string;
      interviewCompleted: boolean;
      interviewNotes?: string;
      notes?: string;
    };
    stage5_languageTest: {
      status: 'pending' | 'in-review' | 'approved' | 'rejected';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      testScore?: number;
      passingScore: number;
      language: string;
      testUrl?: string;
      notes?: string;
    };
    stage6_introductoryCall: {
      status: 'pending' | 'scheduled' | 'completed' | 'no-show' | 'approved' | 'rejected';
      submittedAt?: Date;
      scheduledDate?: Date;
      completedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      callDuration?: number;
      interviewerNotes?: string;
      communicationRating?: number;
      technicalRating?: number;
      personalityRating?: number;
      overallImpression?: string;
      notes?: string;
    };
    stage7_curriculumAlignment: {
      status: 'pending' | 'in-review' | 'approved' | 'rejected';
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedBy?: mongoose.Types.ObjectId;
      curriculumTest: {
        curriculum: 'US' | 'UK' | 'Nigeria';
        score: number;
        passingScore: number;
        testUrl?: string;
      }[];
      lessonPlanSubmitted: boolean;
      lessonPlanUrl?: string;
      lessonPlanRating?: number;
      notes?: string;
    };
  };
  overallVerificationStatus: 'pending' | 'in-progress' | 'verified' | 'rejected' | 'suspended';
  verificationCompletedAt?: Date;
  rating: {
    overall: number;
    totalReviews: number;
    communication: number;
    punctuality: number;
    knowledge: number;
    patience: number;
  };
  teachingPreferences: {
    preferredCurriculum: string[];
    preferredGradeLevels: string[];
    maxStudentsPerClass: number;
    availability: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
  earnings: {
    totalEarned: number;
    pendingEarnings: number;
    lastPayoutDate?: Date;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
  };
  statistics: {
    totalClasses: number;
    totalStudents: number;
    completionRate: number;
    averageAttendance: number;
    responseTime: number; // in minutes
  };
  isActive: boolean;
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  checkVerificationComplete: () => Promise<ITutor>;
  updateRating: (
    communication: number,
    punctuality: number,
    knowledge: number,
    patience: number
  ) => Promise<ITutor>;
}

const tutorSchema = new Schema<ITutor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tutorCode: {
      type: String,
      unique: true,
    },
    photoUrl: String,
    qualifications: [
      {
        degree: String,
        institution: String,
        graduationYear: Number,
        major: String,
        certificationUrl: String,
      },
    ],
    expertise: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
        },
        proficiencyLevel: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        yearsOfExperience: Number,
        certifications: [String],
      },
    ],
    experience: [
      {
        title: String,
        institution: String,
        startDate: Date,
        endDate: Date,
        description: String,
        isCurrent: Boolean,
      },
    ],
    verificationStages: {
      stage1_certificationVerification: {
        status: {
          type: String,
          enum: ['pending', 'in-review', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        documents: [
          {
            fileName: String,
            fileUrl: String,
            fileType: String,
          },
        ],
        notes: String,
      },
      stage2_experienceVerification: {
        status: {
          type: String,
          enum: ['pending', 'in-review', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        references: [
          {
            name: String,
            position: String,
            institution: String,
            email: String,
            phone: String,
            verified: {
              type: Boolean,
              default: false,
            },
          },
        ],
        notes: String,
      },
      stage3_demoVideo: {
        status: {
          type: String,
          enum: ['pending', 'in-review', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        videoUrl: String,
        duration: Number,
        topic: String,
        rating: Number,
        feedback: String,
        notes: String,
      },
      stage4_ethicsReview: {
        status: {
          type: String,
          enum: ['pending', 'in-review', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        backgroundCheckCompleted: {
          type: Boolean,
          default: false,
        },
        backgroundCheckUrl: String,
        policeClearance: String,
        interviewCompleted: {
          type: Boolean,
          default: false,
        },
        interviewNotes: String,
        notes: String,
      },
      stage5_languageTest: {
        status: {
          type: String,
          enum: ['pending', 'in-review', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        testScore: Number,
        passingScore: {
          type: Number,
          default: 70,
        },
        language: String,
        testUrl: String,
        notes: String,
      },
      stage6_introductoryCall: {
        status: {
          type: String,
          enum: ['pending', 'scheduled', 'completed', 'no-show', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        scheduledDate: Date,
        completedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        callDuration: Number,
        interviewerNotes: String,
        communicationRating: Number,
        technicalRating: Number,
        personalityRating: Number,
        overallImpression: String,
        notes: String,
      },
      stage7_curriculumAlignment: {
        status: {
          type: String,
          enum: ['pending', 'in-review', 'approved', 'rejected'],
          default: 'pending',
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: Schema.Types.ObjectId,
        curriculumTest: [
          {
            curriculum: {
              type: String,
              enum: ['US', 'UK', 'Nigeria'],
            },
            score: Number,
            passingScore: {
              type: Number,
              default: 80,
            },
            testUrl: String,
          },
        ],
        lessonPlanSubmitted: {
          type: Boolean,
          default: false,
        },
        lessonPlanUrl: String,
        lessonPlanRating: Number,
        notes: String,
      },
    },
    overallVerificationStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },
    verificationCompletedAt: Date,
    rating: {
      overall: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      communication: {
        type: Number,
        default: 0,
      },
      punctuality: {
        type: Number,
        default: 0,
      },
      knowledge: {
        type: Number,
        default: 0,
      },
      patience: {
        type: Number,
        default: 0,
      },
    },
    teachingPreferences: {
      preferredCurriculum: [String],
      preferredGradeLevels: [String],
      maxStudentsPerClass: {
        type: Number,
        default: 10,
      },
      availability: [
        {
          day: String,
          startTime: String,
          endTime: String,
        },
      ],
    },
    earnings: {
      totalEarned: {
        type: Number,
        default: 0,
      },
      pendingEarnings: {
        type: Number,
        default: 0,
      },
      lastPayoutDate: Date,
      bankDetails: {
        bankName: String,
        accountNumber: String,
        accountName: String,
      },
    },
    statistics: {
      totalClasses: {
        type: Number,
        default: 0,
      },
      totalStudents: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      averageAttendance: {
        type: Number,
        default: 0,
      },
      responseTime: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    suspendedAt: Date,
    suspensionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
tutorSchema.index({ userId: 1 });
tutorSchema.index({ tutorCode: 1 });
tutorSchema.index({ overallVerificationStatus: 1 });
tutorSchema.index({ isActive: 1 });
tutorSchema.index({ 'rating.overall': -1 });

// Auto-generate tutor code
tutorSchema.pre('save', async function (next) {
  if (!this.tutorCode) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.tutorCode = `TUT${year}${randomNum}`;
  }
  next();
});

// Check if all stages are approved
tutorSchema.methods.checkVerificationComplete = function () {
  const stages = this.verificationStages;
  const allApproved =
    stages.stage1_certificationVerification.status === 'approved' &&
    stages.stage2_experienceVerification.status === 'approved' &&
    stages.stage3_demoVideo.status === 'approved' &&
    stages.stage4_ethicsReview.status === 'approved' &&
    stages.stage5_languageTest.status === 'approved' &&
    stages.stage6_introductoryCall.status === 'approved' &&
    stages.stage7_curriculumAlignment.status === 'approved';

  if (allApproved) {
    this.overallVerificationStatus = 'verified';
    this.verificationCompletedAt = new Date();
  }

  return this.save();
};

// Update rating
tutorSchema.methods.updateRating = function (
  communication: number,
  punctuality: number,
  knowledge: number,
  patience: number
) {
  const newTotal = this.rating.totalReviews + 1;

  this.rating.communication =
    (this.rating.communication * this.rating.totalReviews + communication) / newTotal;
  this.rating.punctuality =
    (this.rating.punctuality * this.rating.totalReviews + punctuality) / newTotal;
  this.rating.knowledge =
    (this.rating.knowledge * this.rating.totalReviews + knowledge) / newTotal;
  this.rating.patience =
    (this.rating.patience * this.rating.totalReviews + patience) / newTotal;

  this.rating.overall =
    (this.rating.communication +
      this.rating.punctuality +
      this.rating.knowledge +
      this.rating.patience) /
    4;

  this.rating.totalReviews = newTotal;

  return this.save();
};

export default mongoose.model<ITutor>('Tutor', tutorSchema);
