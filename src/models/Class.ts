import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  classCode: string;
  type: 'live' | 'recorded';
  subjectId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  students: {
    studentId: mongoose.Types.ObjectId;
    enrollmentDate: Date;
    status: 'active' | 'completed' | 'dropped';
  }[];
  schedule: {
    day: string; // Monday, Tuesday, etc.
    startTime: string; // 14:00
    endTime: string; // 15:00
    timezone: string;
    frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
    startDate: Date;
    endDate?: Date;
  };
  sessions: {
    sessionNumber: number;
    sessionDate: Date;
    startTime: string;
    endTime: string;
    topic: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    
    // Zoom Meeting Details (using regular Zoom links)
    zoomMeetingLink?: string; // e.g., https://zoom.us/j/123456789
    zoomMeetingId?: string;
    zoomPassword?: string;
    
    // Google Calendar Integration
    googleCalendarEventId?: string;
    googleCalendarLink?: string;
    
    // Recording
    recordingUrl?: string;
    recordingPassword?: string;
    duration?: number; // minutes
    
    // Attendance
    attendance: {
      studentId: mongoose.Types.ObjectId;
      present: boolean;
      joinTime?: Date;
      leaveTime?: Date;
    }[];
    
    // Class Materials
    notes?: string;
    homework?: {
      title: string;
      description: string;
      dueDate: Date;
      attachments: string[];
    };
  }[];
  curriculum: string;
  maxStudents: number;
  currentEnrollment: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updateEnrollment: () => Promise<IClass>;
}

const classSchema = new Schema<IClass>(
  {
    classCode: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['live', 'recorded'],
      default: 'live',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [
      {
        studentId: {
          type: Schema.Types.ObjectId,
          ref: 'Student',
        },
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'dropped'],
          default: 'active',
        },
      },
    ],
    schedule: {
      day: {
        type: String,
        required: true,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      timezone: {
        type: String,
        default: 'Africa/Lagos',
      },
      frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly',
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: Date,
    },
    sessions: [
      {
        sessionNumber: Number,
        sessionDate: Date,
        startTime: String,
        endTime: String,
        topic: String,
        status: {
          type: String,
          enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
          default: 'scheduled',
        },
        
        // Zoom Meeting (Regular Links)
        zoomMeetingLink: String,
        zoomMeetingId: String,
        zoomPassword: String,
        
        // Google Calendar
        googleCalendarEventId: String,
        googleCalendarLink: String,
        
        // Recording
        recordingUrl: String,
        recordingPassword: String,
        duration: Number,
        
        // Attendance
        attendance: [
          {
            studentId: {
              type: Schema.Types.ObjectId,
              ref: 'Student',
            },
            present: {
              type: Boolean,
              default: false,
            },
            joinTime: Date,
            leaveTime: Date,
          },
        ],
        
        notes: String,
        homework: {
          title: String,
          description: String,
          dueDate: Date,
          attachments: [String],
        },
      },
    ],
    curriculum: {
      type: String,
      enum: ['US', 'UK', 'Nigeria'],
      required: true,
    },
    maxStudents: {
      type: Number,
      default: 20,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique class code
classSchema.pre('save', async function (next) {
  if (!this.classCode) {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.classCode = `CS${Date.now()}-${randomCode}`;
  }
  next();
});

// Update enrollment count
classSchema.methods.updateEnrollment = function () {
  this.currentEnrollment = this.students.filter(
    (s: { status: string }) => s.status === 'active'
  ).length;
  return this.save();
};

export default mongoose.model<IClass>('Class', classSchema);
