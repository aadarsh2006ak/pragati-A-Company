const CompanyProfile = require('../models/CompanyProfile');
const StudentProfile = require('../models/StudentProfile');
const Interview = require('../models/Interview');
const User = require('../models/User');
const Joi = require('joi');

// @desc    List all corporate admin profiles
// @route   GET /api/v1/admin/company
// @access  Private (Admin only)
exports.listCompanies = async (req, res) => {
  try {
    const companies = await CompanyProfile.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'isApproved']
      }]
    });
    res.status(200).json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Approve or decline corporate account
// @route   PUT /api/v1/admin/company/:id/approve
// @access  Private (Admin only)
exports.approveCompany = async (req, res) => {
  const schema = Joi.object({
    approve: Joi.boolean().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { approve } = req.body;

  try {
    const companyProfile = await CompanyProfile.findByPk(req.params.id);
    if (!companyProfile) {
      return res.status(404).json({ success: false, error: 'Company profile not found' });
    }

    const user = await User.findByPk(companyProfile.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Associated user account not found' });
    }

    user.isApproved = approve;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Corporate account has been ${approve ? 'approved' : 'declined'}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create recruitment drive
// @route   POST /api/v1/admin/company/drive
// @access  Private (Company Admin only)
exports.createRecruitmentDrive = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    jobDescription: Joi.string().required(),
    salary: Joi.string().required(),
    criteria: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) {
      return res.status(404).json({ success: false, error: 'Company profile not found' });
    }

    const { title, jobDescription, salary, criteria } = req.body;
    const trimmedTitle = title.trim();
    const driveId = Date.now().toString();

    const currentDrives = companyProfile.drives || [];
    const isDuplicate = currentDrives.some(
      drive => drive.title && drive.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        error: 'A recruitment drive with this title already exists'
      });
    }

    companyProfile.drives = [
      ...currentDrives,
      {
        _id: driveId,
        title: trimmedTitle,
        jobDescription,
        salary,
        criteria,
        status: 'active',
        applicants: [],
        createdAt: new Date()
      }
    ];

    await companyProfile.save();

    res.status(201).json({
      success: true,
      message: 'Recruitment drive created successfully',
      drives: companyProfile.drives
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all active recruitment drives
// @route   GET /api/v1/admin/company/drives
// @access  Private
exports.listDrives = async (req, res) => {
  try {
    const companies = await CompanyProfile.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['name']
      }]
    });
    
    // Flatten drives list
    const drivesList = [];
    companies.forEach(company => {
      if (company.drives && Array.isArray(company.drives)) {
        company.drives.forEach(drive => {
          if (drive.status === 'active') {
            drivesList.push({
              driveId: drive._id,
              companyId: company.id,
              companyName: company.companyName,
              title: drive.title,
              jobDescription: drive.jobDescription,
              salary: drive.salary,
              criteria: drive.criteria,
              createdAt: drive.createdAt
            });
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      count: drivesList.length,
      drives: drivesList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Apply to recruitment drive
// @route   POST /api/v1/admin/company/drives/:id/apply
// @access  Private (Student only)
exports.applyToDrive = async (req, res) => {
  try {
    const driveId = req.params.id;
    const studentId = req.user.id;

    // Find student profile
    const studentProfile = await StudentProfile.findOne({ where: { userId: studentId } });
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Verify student is onboarded
    if (!studentProfile.onboardingComplete) {
      return res.status(400).json({ success: false, error: 'Onboarding profile verification required by College before applying' });
    }

    // Find company drive
    const allCompanyProfiles = await CompanyProfile.findAll();
    const company = allCompanyProfiles.find(c => c.drives && c.drives.some(d => d._id === driveId));
    if (!company) {
      return res.status(404).json({ success: false, error: 'Recruitment drive not found' });
    }

    const drivesCopy = JSON.parse(JSON.stringify(company.drives));
    const drive = drivesCopy.find(d => d._id === driveId);
    
    // Check if student has already applied
    const alreadyApplied = drive.applicants.some(
      app => app.student.toString() === studentId.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ success: false, error: 'You have already applied to this drive' });
    }

    // Add student as applicant
    drive.applicants.push({ student: studentId, status: 'applied', appliedAt: new Date() });
    company.drives = drivesCopy;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Successfully applied for recruitment drive',
      drive
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Assign/Schedule an interview
// @route   POST /api/v1/admin/company/interview or /api/v1/company/interview
// @access  Private (Company Admin or Admin)
exports.scheduleInterview = async (req, res) => {
  const schema = Joi.object({
    studentId: Joi.number().integer().required(),
    driveId: Joi.string().required(),
    dateTime: Joi.date().iso().required(),
    feedback: Joi.string().allow(''),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled').default('scheduled'),
    companyId: Joi.number().integer()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { studentId, driveId, dateTime, feedback, status } = req.body;

  // Validate that interview date is not in the past
  const interviewDate = new Date(dateTime);
  if (isNaN(interviewDate.getTime())) {
    return res.status(400).json({ success: false, error: 'Invalid interview date and time' });
  }
  if (interviewDate < new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Interview date and time cannot be in the past'
    });
  }

  try {
    // Check if student exists
    const studentUser = await User.findOne({ where: { id: studentId, role: 'student' } });
    if (!studentUser) {
      return res.status(404).json({ success: false, error: 'Student user not found' });
    }

    // Determine companyId
    let companyId = req.user.id;
    if (req.user.role === 'admin' && req.body.companyId) {
      companyId = req.body.companyId;
    }

    const interview = await Interview.create({
      studentId,
      companyId,
      driveId,
      dateTime,
      status: status || 'scheduled',
      feedback: feedback || ''
    });

    // Update drive applicant status if matching drive found
    const companyProfile = await CompanyProfile.findOne({ where: { userId: companyId } });
    if (companyProfile && companyProfile.drives) {
      const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives));
      const drive = drivesCopy.find(d => d._id === driveId || d.id === driveId);
      if (drive && drive.applicants) {
        const applicant = drive.applicants.find(a => a.student.toString() === studentId.toString());
        if (applicant) {
          applicant.status = 'interview_scheduled';
          companyProfile.drives = drivesCopy;
          await companyProfile.save();
        }
      }
    }

    const populatedInterview = await Interview.findByPk(interview.id, {
      include: [
        { model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'company', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Interview assigned successfully',
      interview: populatedInterview || interview
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Edit/Update interview details
// @route   PUT /api/v1/admin/company/interview/:id or /api/v1/company/interview/:id
// @access  Private (Company Admin or Admin)
exports.updateInterview = async (req, res) => {
  const schema = Joi.object({
    dateTime: Joi.date().iso(),
    status: Joi.string().valid('scheduled', 'completed', 'cancelled'),
    feedback: Joi.string().allow(''),
    driveId: Joi.string(),
    studentId: Joi.number().integer()
  }).min(1);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const interview = await Interview.findByPk(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Verify company ownership unless admin
    if (req.user.role === 'company' && interview.companyId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this interview' });
    }

    const { dateTime, status, feedback, driveId, studentId } = req.body;

    if (dateTime !== undefined) {
      const updatedDate = new Date(dateTime);
      if (isNaN(updatedDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid interview date and time' });
      }
      const targetStatus = status || interview.status;
      if (targetStatus === 'scheduled' && updatedDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Interview date and time cannot be in the past'
        });
      }
      interview.dateTime = dateTime;
    }
    if (status !== undefined) interview.status = status;
    if (feedback !== undefined) interview.feedback = feedback;
    if (driveId !== undefined) interview.driveId = driveId;
    if (studentId !== undefined) interview.studentId = studentId;

    await interview.save();

    // Update drive applicant status if completed or cancelled
    if (status) {
      const companyProfile = await CompanyProfile.findOne({ where: { userId: interview.companyId } });
      if (companyProfile && companyProfile.drives) {
        const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives));
        const drive = drivesCopy.find(d => d._id === interview.driveId || d.id === interview.driveId);
        if (drive && drive.applicants) {
          const applicant = drive.applicants.find(a => a.student.toString() === interview.studentId.toString());
          if (applicant) {
            if (status === 'completed') applicant.status = 'interview_completed';
            if (status === 'cancelled') applicant.status = 'interview_cancelled';
            companyProfile.drives = drivesCopy;
            await companyProfile.save();
          }
        }
      }
    }

    // Fetch updated interview with relations
    const updatedInterview = await Interview.findByPk(interview.id, {
      include: [
        { model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'company', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Interview details updated successfully',
      interview: updatedInterview || interview
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    List interviews
// @route   GET /api/v1/admin/company/interviews or /api/v1/company/interviews
// @access  Private (Company, Admin, Student)
exports.listInterviews = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'company') {
      where.companyId = req.user.id;
    } else if (req.user.role === 'student') {
      where.studentId = req.user.id;
    }

    if (req.query.driveId) {
      where.driveId = req.query.driveId;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }

    const interviews = await Interview.findAll({
      where,
      include: [
        { model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'company', attributes: ['id', 'name', 'email'] }
      ],
      order: [['dateTime', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single interview details
// @route   GET /api/v1/admin/company/interview/:id or /api/v1/company/interview/:id
// @access  Private (Company, Admin, Student)
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findByPk(req.params.id, {
      include: [
        { model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'company', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Check access
    if (req.user.role === 'company' && interview.companyId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this interview' });
    }
    if (req.user.role === 'student' && interview.studentId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this interview' });
    }

    res.status(200).json({
      success: true,
      interview
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete/Cancel interview
// @route   DELETE /api/v1/admin/company/interview/:id or /api/v1/company/interview/:id
// @access  Private (Company Admin or Admin)
exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findByPk(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    if (req.user.role === 'company' && interview.companyId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this interview' });
    }

    await interview.destroy();

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get company settings
// @route   GET /api/v1/company/settings
// @access  Private (Company Admin only)
exports.getCompanySettings = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!companyProfile) {
      return res.status(404).json({ success: false, error: 'Company profile not found' });
    }

    res.status(200).json(companyProfile);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update company settings
// @route   PUT /api/v1/company/settings
// @access  Private (Company Admin only)
exports.updateCompanySettings = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!companyProfile) {
      return res.status(404).json({ success: false, error: 'Company profile not found' });
    }

    const { companyName, description, website } = req.body;

    if (companyName !== undefined) companyProfile.companyName = companyName;
    if (description !== undefined) companyProfile.description = description;
    if (website !== undefined) companyProfile.website = website;

    await companyProfile.save();

    res.status(200).json(companyProfile);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

