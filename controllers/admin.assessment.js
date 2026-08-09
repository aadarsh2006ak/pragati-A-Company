const Assessment = require('../models/Assessment');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Joi = require('joi');

// @desc    Create a new assessment
// @route   POST /api/v1/admin/assessments
// @access  Private (Admin or Mentor only)
exports.createAssessment = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    type: Joi.string().valid('quiz', 'coding').default('quiz'),
    questions: Joi.array().items(
      Joi.object({
        questionText: Joi.string().required(),
        options: Joi.array().items(Joi.string()).when('type', { is: 'quiz', then: Joi.required() }),
        correctOption: Joi.number().when('type', { is: 'quiz', then: Joi.required() }),
        testCases: Joi.array().items(
          Joi.object({
            input: Joi.string().required(),
            expectedOutput: Joi.string().required()
          })
        ).when('type', { is: 'coding', then: Joi.required() })
      })
    ).min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const { title, description, type, questions } = req.body;

    const assessment = await Assessment.create({
      title,
      description,
      type,
      questions,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all assessments
// @route   GET /api/v1/admin/assessments
// @access  Private
exports.listAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.findAll({
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['name', 'email']
      }]
    });
    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Submit assessment answers
// @route   POST /api/v1/admin/assessments/submit
// @access  Private (Student only)
exports.submitAssessment = async (req, res) => {
  const schema = Joi.object({
    assessmentId: Joi.number().integer().required(),
    score: Joi.number().min(0).max(100).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { assessmentId, score } = req.body;

  try {
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    const studentProfile = await StudentProfile.findOne({ where: { userId: req.user.id } });
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Add submission score to profile
    const assessmentsCopy = JSON.parse(JSON.stringify(studentProfile.assessments || []));
    assessmentsCopy.push({
      assessment: assessmentId,
      score,
      submittedAt: new Date()
    });

    studentProfile.assessments = assessmentsCopy;
    await studentProfile.save();

    res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      score,
      assessmentsSubmitted: studentProfile.assessments
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
