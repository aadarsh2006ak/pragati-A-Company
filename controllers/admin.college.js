const CollegeProfile = require('../models/CollegeProfile');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Joi = require('joi');

// @desc    List all colleges
// @route   GET /api/v1/admin/colleges
// @access  Private (Admin only)
exports.listColleges = async (req, res) => {
  try {
    const colleges = await CollegeProfile.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });
    res.status(200).json({
      success: true,
      count: colleges.length,
      colleges
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Verify student profile onboarding status
// @route   POST /api/v1/admin/colleges/verify
// @access  Private (Admin or College)
exports.verifyStudentProfile = async (req, res) => {
  const schema = Joi.object({
    studentId: Joi.number().integer().required(),
    onboardingComplete: Joi.boolean().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { studentId, onboardingComplete } = req.body;

  try {
    const profile = await StudentProfile.findOne({ where: { userId: studentId } });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // If request user is college, verify they own this student
    if (req.user.role === 'college') {
      const collegeProfile = await CollegeProfile.findOne({ where: { userId: req.user.id } });
      if (!collegeProfile || profile.college.toString() !== collegeProfile.id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to verify student from another college' });
      }
    }

    profile.onboardingComplete = onboardingComplete;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Student onboarding profile status updated to ${onboardingComplete}`,
      profile
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Register a list/roster of student emails that belong to the college
// @route   POST /api/v1/admin/colleges/roster
// @access  Private (College only)
exports.registerStudentRoster = async (req, res) => {
  const schema = Joi.object({
    students: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      })
    ).min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const collegeProfile = await CollegeProfile.findOne({ where: { userId: req.user.id } });
    if (!collegeProfile) {
      return res.status(404).json({ success: false, error: 'College profile not found' });
    }

    const newStudents = req.body.students;
    const studentRosterCopy = JSON.parse(JSON.stringify(collegeProfile.studentRoster || []));

    // Check if students in list are already registered in system
    for (let student of newStudents) {
      const isRegistered = await User.findOne({ where: { email: student.email, role: 'student' } }) !== null;
      
      // Push or update roster
      const existsInRoster = studentRosterCopy.some(s => s.email === student.email);
      if (!existsInRoster) {
        studentRosterCopy.push({
          name: student.name,
          email: student.email,
          isRegistered: !!isRegistered
        });
      } else {
        // Update registration status
        const item = studentRosterCopy.find(s => s.email === student.email);
        item.isRegistered = !!isRegistered;
      }
    }

    collegeProfile.studentRoster = studentRosterCopy;
    await collegeProfile.save();

    res.status(200).json({
      success: true,
      message: 'Student roster updated successfully',
      roster: collegeProfile.studentRoster
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
