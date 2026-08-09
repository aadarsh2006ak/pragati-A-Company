const Dispute = require('../models/Dispute');
const User = require('../models/User');
const Joi = require('joi');

// @desc    Create/Open a placement dispute
// @route   POST /api/v1/admin/disputes
// @access  Private (Student only)
exports.createDispute = async (req, res) => {
  const schema = Joi.object({
    subject: Joi.string().required(),
    description: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { subject, description } = req.body;

  try {
    const dispute = await Dispute.create({
      studentId: req.user.id,
      subject,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Placement dispute raised successfully',
      dispute
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    List disputes
// @route   GET /api/v1/admin/disputes
// @access  Private (Admin or Student)
exports.listDisputes = async (req, res) => {
  try {
    let disputes;

    if (req.user.role === 'admin') {
      // Admins see all disputes
      disputes = await Dispute.findAll({
        include: [{
          model: User,
          as: 'student',
          attributes: ['name', 'email']
        }]
      });
    } else {
      // Students only see their own disputes
      disputes = await Dispute.findAll({ where: { studentId: req.user.id } });
    }

    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Resolve a dispute
// @route   PUT /api/v1/admin/disputes/:id/resolve
// @access  Private (Admin only)
exports.resolveDispute = async (req, res) => {
  const schema = Joi.object({
    resolutionNotes: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const dispute = await Dispute.findByPk(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, error: 'Dispute record not found' });
    }

    dispute.status = 'resolved';
    dispute.resolvedBy = req.user.id;
    dispute.resolutionNotes = req.body.resolutionNotes;
    await dispute.save();

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
