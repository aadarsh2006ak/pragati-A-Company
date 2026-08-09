const { Op } = require('sequelize');
const StudentProfile = require('../models/StudentProfile');
const Interview = require('../models/Interview');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

// @desc    Get Student Dashboard Stats
// @route   GET /api/student/dashboard
// @access  Private (Student only)
exports.getDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student profile
    const profile = await StudentProfile.findOne({ where: { userId: studentId } });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Convert profile to plain JSON for manual population
    const profileJson = profile.toJSON();

    // Manually populate courses
    if (profileJson.courses && profileJson.courses.length > 0) {
      const courseIds = profileJson.courses.map(c => c.course);
      const coursesObjList = await Course.findAll({ where: { id: courseIds } });
      const coursesMap = {};
      coursesObjList.forEach(c => { coursesMap[c.id] = c.toJSON(); });
      profileJson.courses = profileJson.courses.map(c => ({
        ...c,
        course: coursesMap[c.course] || null
      }));
    }

    // Manually populate assessments
    if (profileJson.assessments && profileJson.assessments.length > 0) {
      const assessmentIds = profileJson.assessments.map(a => a.assessment);
      const assessmentsObjList = await Assessment.findAll({ where: { id: assessmentIds } });
      const assessmentsMap = {};
      assessmentsObjList.forEach(a => { assessmentsMap[a.id] = a.toJSON(); });
      profileJson.assessments = profileJson.assessments.map(a => ({
        ...a,
        assessment: assessmentsMap[a.assessment] || null
      }));
    }

    // Get upcoming interviews
    const upcomingInterviews = await Interview.findAll({
      where: {
        studentId: studentId,
        status: 'scheduled',
        dateTime: {
          [Op.gte]: new Date()
        }
      },
      include: [{
        model: User,
        as: 'company',
        attributes: ['name', 'email']
      }]
    });

    // Stats calculations
    const coursesEnrolledCount = profileJson.courses.length;
    const coursesCompletedCount = profileJson.courses.filter(c => c.status === 'completed').length;
    
    let avgAssessmentScore = 0;
    if (profileJson.assessments.length > 0) {
      const sum = profileJson.assessments.reduce((acc, curr) => acc + curr.score, 0);
      avgAssessmentScore = sum / profileJson.assessments.length;
    }

    const totalOffers = profileJson.offers.length;
    const acceptedOffers = profileJson.offers.filter(o => o.status === 'accepted').length;

    res.status(200).json({
      success: true,
      data: {
        profile: {
          cgpa: profileJson.cgpa,
          branch: profileJson.branch,
          graduationYear: profileJson.graduationYear,
          skills: profileJson.skills,
          onboardingComplete: profileJson.onboardingComplete
        },
        stats: {
          coursesEnrolled: coursesEnrolledCount,
          coursesCompleted: coursesCompletedCount,
          avgAssessmentScore: parseFloat(avgAssessmentScore.toFixed(2)),
          totalOffers,
          acceptedOffers
        },
        upcomingInterviews,
        courses: profileJson.courses,
        assessments: profileJson.assessments,
        offers: profileJson.offers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
