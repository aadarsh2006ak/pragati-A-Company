require('dotenv').config();
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const CollegeProfile = require('../models/CollegeProfile');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Dispute = require('../models/Dispute');
const Interview = require('../models/Interview');

const seedDB = async () => {
  try {
    console.log('Connecting to PostgreSQL database for seeding...');
    await sequelize.authenticate();

    // Clear DB (Truncate tables)
    // Disable foreign key checks to truncate cleanly
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Clear all tables
    await Interview.destroy({ where: {}, truncate: { cascade: true } });
    await Dispute.destroy({ where: {}, truncate: { cascade: true } });
    await Assessment.destroy({ where: {}, truncate: { cascade: true } });
    await Course.destroy({ where: {}, truncate: { cascade: true } });
    await CompanyProfile.destroy({ where: {}, truncate: { cascade: true } });
    await StudentProfile.destroy({ where: {}, truncate: { cascade: true } });
    await CollegeProfile.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });
    
    console.log('Database tables cleared.');

    // 1. Create College User and Profile
    const collegeUser = await User.create({
      name: 'Pragati Engineering College',
      email: 'college@example.com',
      password: 'Password123',
      role: 'college',
      isApproved: true
    });
    
    const collegeProfile = await CollegeProfile.create({
      userId: collegeUser.id,
      collegeName: 'Pragati Engineering College',
      studentRoster: [
        { name: 'John Student', email: 'student@example.com', isRegistered: true },
        { name: 'Alice Student', email: 'alice@example.com', isRegistered: false }
      ]
    });

    // 2. Create Student User and Profile
    const studentUser = await User.create({
      name: 'John Student',
      email: 'student@example.com',
      password: 'Password123',
      role: 'student',
      isApproved: true
    });
    
    const studentProfile = await StudentProfile.create({
      userId: studentUser.id,
      college: collegeProfile.id,
      onboardingComplete: true,
      cgpa: 8.5,
      branch: 'Computer Science',
      graduationYear: 2027,
      skills: ['React', 'Node.js', 'MongoDB', 'Python'],
      courses: [],
      assessments: [],
      offers: []
    });

    // 3. Create Corporate User and Profile
    const companyUser = await User.create({
      name: 'MetaTech Corporates',
      email: 'company@gmail.com',
      password: 'Password123',
      role: 'company',
      isApproved: true // Pre-approved for testing
    });
    
    const companyProfile = await CompanyProfile.create({
      userId: companyUser.id,
      companyName: 'MetaTech Corporates',
      description: 'A global leader in web technologies.',
      website: 'https://metatech.example.com',
      drives: [
        {
          _id: "1", // Use "1" for seed drive id
          title: 'Associate Software Engineer',
          jobDescription: 'Develop web features using React/Node.js stack.',
          salary: '$85,000/year',
          criteria: 'CGPA > 7.5, basic knowledge of JavaScript',
          status: 'active',
          applicants: [
            { student: studentUser.id, status: 'applied', appliedAt: new Date() }
          ],
          createdAt: new Date()
        }
      ]
    });

    // 4. Create Mentor User
    const mentorUser = await User.create({
      name: 'Dr. Sarah Mentor',
      email: 'mentor@example.com',
      password: 'Password123',
      role: 'mentor',
      isApproved: true
    });

    // 5. Create Admin User
    await User.create({
      name: 'System Admin',
      email: 'admin@pragati.com',
      password: 'Password123',
      role: 'admin',
      isApproved: true
    });

    // 6. Create Course by Mentor
    const course = await Course.create({
      title: 'Full-Stack Web Development Bootcamp',
      description: 'Learn MERN stack development from scratch.',
      createdById: mentorUser.id,
      modules: [
        { title: 'Introduction to MongoDB', content: 'Database basics and schema design.' },
        { title: 'Building REST APIs with Express', content: 'Routing and middleware logic.' }
      ],
      assignments: [
        { _id: "assignment-1", title: 'Build a Simple API', problemStatement: 'Create an Express app with CRUD endpoints.' }
      ]
    });

    // Associate course with student profile
    studentProfile.courses = [{
      course: course.id,
      status: 'enrolled',
      progress: 30
    }];

    // 7. Create Assessment by Mentor
    const assessment = await Assessment.create({
      title: 'JavaScript Essentials Test',
      description: 'Verify understanding of asynchronous JS and ES6 features.',
      type: 'quiz',
      createdById: mentorUser.id,
      questions: [
        {
          questionText: 'What is the correct syntax for an arrow function?',
          options: ['() => {}', 'function() => {}', 'arrow() => {}', '() -> {}'],
          correctOption: 0
        }
      ]
    });

    // Add assessment result to student profile
    studentProfile.assessments = [{
      assessment: assessment.id,
      score: 90,
      submittedAt: new Date()
    }];

    await studentProfile.save();

    // 8. Create Dispute
    await Dispute.create({
      studentId: studentUser.id,
      subject: 'Interview Schedule Conflict',
      description: 'My interview time conflicts with the semester final exam schedule.'
    });

    // 9. Create Scheduled Interview
    const driveId = companyProfile.drives[0]._id;
    await Interview.create({
      studentId: studentUser.id,
      companyId: companyUser.id,
      driveId: driveId.toString(),
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) // Scheduled for 3 days from now
    });

    console.log('Database seeded successfully in PostgreSQL!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err.message);
    process.exit(1);
  }
};

seedDB();
