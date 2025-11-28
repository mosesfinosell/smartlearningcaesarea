import mongoose from 'mongoose';
import User from '../models/User';
import Tutor from '../models/Tutor';

type SeedTutor = {
  name: string;
  subjects: string[];
  languages: string[];
  email?: string;
};

const seedTutors: SeedTutor[] = [
  { name: 'Amaka Okafor', subjects: ['English', 'Yoruba'], languages: ['English', 'Yoruba'] },
  { name: 'Jean Pierre', subjects: ['French'], languages: ['French', 'English'] },
  { name: 'Chen Li', subjects: ['Chinese'], languages: ['Chinese', 'English'] },
  { name: 'Priya Singh', subjects: ['English'], languages: ['English', 'Hindi'] },
  { name: 'Owen Larson', subjects: ['English'], languages: ['English'] },
  { name: 'Sarah Kelly', subjects: ['English'], languages: ['English'] },
  { name: 'Hauwa Sule', subjects: ['Hausa', 'English'], languages: ['Hausa', 'English'] },
  { name: 'Jürgen Meyer', subjects: ['German'], languages: ['German', 'English'] },
  { name: 'Tunde Ade', subjects: ['Math', 'Science'], languages: ['English', 'Yoruba'] },
  { name: 'Chioma Eze', subjects: ['English', 'Igbo'], languages: ['English', 'Igbo'] },
  { name: 'Lara Musa', subjects: ['English'], languages: ['English'] },
  { name: 'Ethan Dube', subjects: ['English'], languages: ['English'] },
  { name: 'Maria Rossi', subjects: ['English'], languages: ['English', 'Italian'] },
  { name: 'David Chen', subjects: ['Chinese', 'Math'], languages: ['Chinese', 'English'] },
  { name: 'Aisha Bello', subjects: ['English'], languages: ['English', 'Hausa'] },
  { name: 'Kelvin Grant', subjects: ['English'], languages: ['English'] },
  { name: 'Fatima Yusuf', subjects: ['English'], languages: ['English'] },
  { name: 'Ibrahim Suleiman', subjects: ['Math', 'Science'], languages: ['English'] },
  { name: 'Grace Mensah', subjects: ['English'], languages: ['English'] },
  { name: 'Samuel Wright', subjects: ['English'], languages: ['English'] },
  { name: 'Elena Petrova', subjects: ['English'], languages: ['English', 'Russian'] },
  { name: 'Kwame Boateng', subjects: ['Math'], languages: ['English'] },
  { name: 'Nina Alvarez', subjects: ['English'], languages: ['English', 'Spanish'] },
  { name: 'Yemi Adedeji', subjects: ['English', 'Yoruba'], languages: ['English', 'Yoruba'] },
  { name: 'Zara Khan', subjects: ['English'], languages: ['English'] },
  { name: 'Michael Stone', subjects: ['English'], languages: ['English'] },
  { name: 'Linda Wu', subjects: ['Chinese', 'English'], languages: ['Chinese', 'English'] },
  { name: 'Pedro Silva', subjects: ['English'], languages: ['English', 'Portuguese'] },
  { name: 'Sofia Dimitrova', subjects: ['English'], languages: ['English', 'Bulgarian'] },
  { name: 'Anika Rahman', subjects: ['English'], languages: ['English', 'Bengali'] },
];

function subjectToExpertise(subject: string) {
  return {
    subjectId: new mongoose.Types.ObjectId(), // placeholder subject id
    proficiencyLevel: 'advanced' as const,
    yearsOfExperience: Math.floor(Math.random() * 6) + 3,
    certifications: ['Certified Instructor'],
  };
}

export async function seedTutorsOnBoot() {
  const flag = process.env.SEED_TUTORS_ON_BOOT;
  if (!flag || flag.toLowerCase() !== 'true') {
    return;
  }

  console.log('[SEED] Seeding tutors on boot...');

  for (const tutor of seedTutors) {
    const [firstName, ...lastParts] = tutor.name.split(' ');
    const lastName = lastParts.join(' ') || 'Tutor';
    const email =
      tutor.email ||
      `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@seed.smartlearning.test`;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const existingTutor = await Tutor.findOne({ userId: existingUser._id });
      if (!existingTutor) {
        await Tutor.create({
          userId: existingUser._id,
          tutorCode: `TUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          qualifications: [
            { degree: 'B.A. Education', institution: 'Seed University', graduationYear: 2019, major: tutor.subjects[0] },
          ],
          expertise: tutor.subjects.map(subjectToExpertise),
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
        console.log(`[SEED] Tutor created for existing user: ${tutor.name}`);
      }
      continue;
    }

    const user = await User.create({
      email,
      password: 'Password123',
      role: 'tutor',
      profile: {
        firstName,
        lastName,
        phoneNumber: '0000000000',
        language: tutor.languages,
      },
      status: 'active',
    });

    await Tutor.create({
      userId: user._id,
      tutorCode: `TUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      qualifications: [
        { degree: 'B.A. Education', institution: 'Seed University', graduationYear: 2019, major: tutor.subjects[0] },
      ],
      expertise: tutor.subjects.map(subjectToExpertise),
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

    console.log(`[SEED] Tutor created: ${tutor.name}`);
  }

  console.log('[SEED] Tutor seeding completed.');
}
