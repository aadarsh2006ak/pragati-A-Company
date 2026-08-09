const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const Dispute = require('../models/Dispute');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin only)
exports.getSystemStats = async (req, res) => {
  try {
    // Count roles
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalMentors = await User.count({ where: { role: 'mentor' } });
    const totalColleges = await User.count({ where: { role: 'college' } });
    const totalCompanies = await User.count({ where: { role: 'company' } });

    // Active vs pending companies
    const approvedCompaniesCount = await User.count({ where: { role: 'company', isApproved: true } });
    const pendingCompaniesCount = await User.count({ where: { role: 'company', isApproved: false } });

    // Disputes status
    const totalDisputes = await Dispute.count();
    const pendingDisputes = await Dispute.count({ where: { status: 'pending' } });
    const resolvedDisputes = await Dispute.count({ where: { status: 'resolved' } });

    // Count total drives listed across all company profiles
    const companyProfiles = await CompanyProfile.findAll({});
    let totalDrives = 0;
    let totalApplicants = 0;

    companyProfiles.forEach(profile => {
      if (profile.drives && Array.isArray(profile.drives)) {
        totalDrives += profile.drives.length;
        profile.drives.forEach(drive => {
          if (drive.applicants && Array.isArray(drive.applicants)) {
            totalApplicants += drive.applicants.length;
          }
        });
      }
    });

    // Mock revenue calculations (e.g. system fee per company drive listed)
    const systemRevenue = totalDrives * 1500; // $1500 USD per drive posted

    res.status(200).json({
      success: true,
      data: {
        users: {
          students: totalStudents,
          mentors: totalMentors,
          colleges: totalColleges,
          companies: totalCompanies
        },
        companiesStatus: {
          approved: approvedCompaniesCount,
          pending: pendingCompaniesCount
        },
        disputes: {
          total: totalDisputes,
          pending: pendingDisputes,
          resolved: resolvedDisputes
        },
        drives: {
          totalCount: totalDrives,
          totalApplicants
        },
        systemRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
