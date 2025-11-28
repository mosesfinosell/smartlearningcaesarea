import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Tutor from '../src/models/Tutor';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartlearning';

const subjects = ['English', 'French', 'Chinese', 'German', 'Math', 'Science', 'Coding', 'Music', 'Geography', 'Business'];
const levels = ['beginner', 'intermediate', 'advanced', 'expert'];

const names = [
  'Amaka Okafor',
  'Jean Pierre',
  'Chen Li',
  'Priya Singh',
  'Owen Larson',
  'Sarah Kelly',
  'Hauwa Sule',
  'Jürgen Meyer',
  'Tunde Ade',
  'Chioma Eze',
  'Lara Musa',
  'Ethan Dube',
  'Maria Rossi',
  'David Chen',
  'Aisha Bello',
  'Kelvin Grant',
  'Fatima Yusuf',
  'Ibrahim Suleiman',
  'Grace Mensah',
  'Samuel Wright',
  'Elena Petrova',
  'Kwame Boateng',
  'Nina Alvarez',
  'Yemi Adedeji',
  'Zara Khan',
  'Michael Stone',
  'Linda Wu',
  'Pedro Silva',
  'Sofia Dimitrova',
  'Anika Rahman',
];

function pick<T>(arr: T[], count = 1): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Mongo:', MONGO_URI);

  for (const fullName of names) {
    const [firstName, ...lastParts] = fullName.split(' ');
    const lastName = lastParts.join(' ') || 'Tutor';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`;

    // Create user
    const user = await User.create({
      email,
      password: 'Password123', // should be changed/reset later
      role: 'tutor',
      profile: {
        firstName,
        lastName,
        phoneNumber: '0000000000',
        language: pick(['English', 'French', 'Chinese', 'German', 'Yoruba', 'Hausa', 'Igbo'], 2),
      },
      status: 'active',
    });

    // Create tutor
    await Tutor.create({
      userId: user._id,
      tutorCode: `TUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      qualifications: [
        {
          degree: 'B.A. Education',
          institution: 'SmartLearning University',
          graduationYear: 2018,
          major: pick(subjects, 1)[0],
        },
      ],
      expertise: pick(subjects, 3).map((subj) => ({
        subjectId: new mongoose.Types.ObjectId(), // placeholder subject id
        proficiencyLevel: pick(levels, 1)[0] as any,
        yearsOfExperience: Math.floor(Math.random() * 7) + 3,
        certifications: ['Certified Instructor'],
      })),
      experience: [
        {
          title: 'Online Tutor',
          institution: 'SmartLearning',
          startDate: new Date('2020-01-01'),
          isCurrent: true,
          description: 'Delivers engaging lessons and tracks learner progress.',
        },
      ],
      verificationStages: {
        stage1_certificationVerification: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date(), documents: [] },
        stage2_experienceVerification: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date(), references: [] },
        stage3_demoVideo: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date() },
        stage4_ethicsReview: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date(), backgroundCheckCompleted: true, interviewCompleted: true },
        stage5_languageTest: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date(), language: 'English', passingScore: 70, testScore: 85 },
        stage6_introductoryCall: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date(), interviewCompleted: true },
        stage7_curriculumAlignment: { status: 'approved', submittedAt: new Date(), reviewedAt: new Date(), curriculumTest: [], lessonPlanSubmitted: true },
      },
      overallVerificationStatus: 'verified',
      verificationCompletedAt: new Date(),
      rating: {
        overall: 4.8,
        totalReviews: Math.floor(Math.random() * 90) + 10,
        communication: 4.8,
        punctuality: 4.7,
        knowledge: 4.9,
        patience: 4.8,
      },
      teachingPreferences: {
        preferredCurriculum: ['US', 'UK', 'Nigeria'],
        preferredGradeLevels: ['Primary', 'Secondary'],
        maxStudentsPerClass: 1,
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00' },
          { day: 'Saturday', startTime: '10:00', endTime: '14:00' },
        ],
      },
      earnings: { totalEarned: 0, pendingEarnings: 0 },
      statistics: {
        totalClasses: Math.floor(Math.random() * 50) + 10,
        totalStudents: Math.floor(Math.random() * 80) + 20,
        completionRate: 95,
        averageAttendance: 92,
        responseTime: 30,
      },
      isActive: true,
    });

    console.log(`Seeded tutor: ${fullName}`);
  }

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seed error', err);
  process.exit(1);
});
