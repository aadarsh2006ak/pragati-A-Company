const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const CollegeProfile = require('../models/CollegeProfile');

// Helper to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  // Validate schema
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('student', 'company', 'mentor', 'college', 'admin').required(),
    // Conditional details based on role
    collegeId: Joi.number().integer().when('role', { is: 'student', then: Joi.required() }),
    companyName: Joi.string().when('role', { is: 'company', then: Joi.required() }),
    collegeName: Joi.string().when('role', { is: 'college', then: Joi.required() })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { name, email, password, role, collegeId, companyName, collegeName } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role
    });

    // Create role-specific profiles
    if (role === 'student') {
      await StudentProfile.create({
        userId: user.id,
        college: collegeId
      });
    } else if (role === 'company') {
      await CompanyProfile.create({
        userId: user.id,
        companyName
      });
    } else if (role === 'college') {
      await CollegeProfile.create({
        userId: user.id,
        collegeName
      });
    }

    const token = signToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if account approved
    if (!user.isApproved) {
      return res.status(403).json({ success: false, error: 'Your account is pending admin approval' });
    }

    const token = signToken(user.id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
