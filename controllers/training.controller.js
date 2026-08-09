const Course = require('../models/Course');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Joi = require('joi');

// @desc    Create a new course (curriculum)
// @route   POST /api/v1/company/training/course
// @access  Private (Mentor or Admin only)
exports.createCourse = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    modules: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        content: Joi.string().allow(''),
        videoUrl: Joi.string().allow('')
      })
    ),
    assignments: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        problemStatement: Joi.string().required()
      })
    )
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { title, description, modules, assignments } = req.body;

  try {
    // Generate UUID/IDs for modules and assignments to simulate MongoDB _ids
    const formattedModules = (modules || []).map((m, idx) => ({ _id: `module-${Date.now()}-${idx}`, ...m }));
    const formattedAssignments = (assignments || []).map((a, idx) => ({ _id: `assignment-${Date.now()}-${idx}`, ...a }));

    const course = await Course.create({
      title,
      description,
      modules: formattedModules,
      assignments: formattedAssignments,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Course built successfully',
      course
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    List all courses
// @route   GET /api/v1/company/training/courses
// @access  Private
exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['name', 'email']
      }]
    });
    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Submit course assignment
// @route   POST /api/v1/company/training/assignment/submit
// @access  Private (Student only)
exports.submitAssignment = async (req, res) => {
  const schema = Joi.object({
    courseId: Joi.number().integer().required(),
    assignmentId: Joi.string().required(),
    submissionContent: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { courseId, assignmentId, submissionContent } = req.body;

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const assignment = (course.assignments || []).find(
      a => a._id === assignmentId || a.id === assignmentId
    );
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found in course' });
    }

    const studentProfile = await StudentProfile.findOne({ where: { userId: req.user.id } });
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    const coursesCopy = JSON.parse(JSON.stringify(studentProfile.courses || []));

    // Check if enrolled
    const courseEnrollment = coursesCopy.find(
      c => c.course.toString() === courseId.toString()
    );

    if (!courseEnrollment) {
      // Enroll student automatically if they submit an assignment
      coursesCopy.push({
        course: courseId,
        status: 'enrolled',
        progress: 10
      });
    } else {
      // Increase progress
      courseEnrollment.progress = Math.min(courseEnrollment.progress + 20, 100);
      if (courseEnrollment.progress === 100) {
        courseEnrollment.status = 'completed';
      }
    }

    studentProfile.courses = coursesCopy;
    await studentProfile.save();

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      courseProgress: studentProfile.courses
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
