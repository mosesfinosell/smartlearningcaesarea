import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  subjectId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  type: 'homework' | 'project' | 'quiz' | 'test' | 'exam';
  dueDate: Date;
  maxScore: number;
  passingScore?: number;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  instructions: string;
  questions?: {
    questionNumber: number;
    questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'fill-blank';
    questionText: string;
    options?: string[];
    correctAnswer?: string;
    marks: number;
    explanation?: string;
  }[];
  submissions: mongoose.Types.DocumentArray<
    mongoose.Types.Subdocument & {
      _id: mongoose.Types.ObjectId;
      studentId: mongoose.Types.ObjectId;
      submittedAt: Date;
      files: {
        fileName: string;
        fileUrl: string;
      }[];
      answers?: any;
      textResponse?: string;
      score?: number;
      percentage?: number;
      grade?: string;
      feedback?: string;
      gradedBy?: mongoose.Types.ObjectId;
      gradedAt?: Date;
      status: 'submitted' | 'graded' | 'late' | 'missing' | 'in-progress';
    }
  >;
  settings: {
    allowLateSubmission: boolean;
    latePenalty?: number;
    autoGrade: boolean;
    showCorrectAnswers: boolean;
    randomizeQuestions: boolean;
  };
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  autoGradeSubmission: (submissionId: string) => Promise<IAssignment>;
  calculateGrade: (percentage: number) => string;
  isLateSubmission: (submissionDate: Date) => boolean;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['homework', 'project', 'quiz', 'test', 'exam'],
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    passingScore: Number,
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
      },
    ],
    instructions: {
      type: String,
      required: true,
    },
    questions: [
      {
        questionNumber: Number,
        questionType: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank'],
        },
        questionText: String,
        options: [String],
        correctAnswer: String,
        marks: Number,
        explanation: String,
      },
    ],
    submissions: [
      {
        studentId: {
          type: Schema.Types.ObjectId,
          ref: 'Student',
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        files: [
          {
            fileName: String,
            fileUrl: String,
          },
        ],
        answers: Schema.Types.Mixed,
        textResponse: String,
        score: Number,
        percentage: Number,
        grade: String,
        feedback: String,
        gradedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        gradedAt: Date,
        status: {
          type: String,
          enum: ['submitted', 'graded', 'late', 'missing', 'in-progress'],
          default: 'submitted',
        },
      },
    ],
    settings: {
      allowLateSubmission: {
        type: Boolean,
        default: true,
      },
      latePenalty: {
        type: Number,
        default: 10,
      },
      autoGrade: {
        type: Boolean,
        default: false,
      },
      showCorrectAnswers: {
        type: Boolean,
        default: false,
      },
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
assignmentSchema.index({ classId: 1 });
assignmentSchema.index({ tutorId: 1 });
assignmentSchema.index({ subjectId: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ 'submissions.studentId': 1 });
assignmentSchema.index({ type: 1 });
assignmentSchema.index({ isPublished: 1 });

// Auto-grade quiz/test if enabled
assignmentSchema.methods.autoGradeSubmission = function (submissionId: string) {
  if (!this.settings.autoGrade || this.type === 'essay') {
    return this;
  }

  const submission = this.submissions.id(submissionId);
  if (!submission) return this;

  let totalScore = 0;
  let maxPossibleScore = 0;

  this.questions?.forEach((question: any, index: number) => {
    maxPossibleScore += question.marks;
    const studentAnswer = submission.answers?.[index];

    if (
      question.questionType === 'multiple-choice' ||
      question.questionType === 'true-false'
    ) {
      if (studentAnswer === question.correctAnswer) {
        totalScore += question.marks;
      }
    }
  });

  submission.score = totalScore;
  submission.percentage = (totalScore / maxPossibleScore) * 100;
  submission.grade = this.calculateGrade(submission.percentage);
  submission.status = 'graded';
  submission.gradedAt = new Date();

  return this.save();
};

// Calculate letter grade
assignmentSchema.methods.calculateGrade = function (percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Check if submission is late
assignmentSchema.methods.isLateSubmission = function (submissionDate: Date): boolean {
  return submissionDate > this.dueDate;
};

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
