const CompanyProfile = require('../models/CompanyProfile');
const StudentProfile = require('../models/StudentProfile');
const CollegeProfile = require('../models/CollegeProfile');
const User = require('../models/User');

const getCandidatesByCompany = async (companyUserId) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) return [];

  const candidatesList = [];

  if (companyProfile.drives && Array.isArray(companyProfile.drives)) {
    for (const drive of companyProfile.drives) {
      if (drive.applicants && Array.isArray(drive.applicants)) {
        for (const app of drive.applicants) {
          const studentProfile = await StudentProfile.findOne({
            where: { userId: app.student },
            include: [{ model: User, as: 'user' }]
          });

          if (studentProfile && studentProfile.user) {
            let collegeName = 'Unknown College';
            if (studentProfile.college) {
              const college = await CollegeProfile.findByPk(studentProfile.college);
              if (college) collegeName = college.collegeName;
            }

            let assessmentScore = 85;
            if (studentProfile.assessments && studentProfile.assessments.length > 0) {
              assessmentScore = studentProfile.assessments[0].score;
            }

            let trainingProgress = 0;
            if (studentProfile.courses && studentProfile.courses.length > 0) {
              trainingProgress = studentProfile.courses[0].progress || 0;
            }

            const name = studentProfile.user.name || 'Candidate';
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

            candidatesList.push({
              id: studentProfile.user.id,
              name: name,
              email: studentProfile.user.email,
              phone: studentProfile.user.phone || '+91 98765 43210',
              location: studentProfile.user.location || 'Hyderabad, India',
              avatar: initials,
              college: collegeName,
              degree: studentProfile.branch || 'B.Tech / B.E',
              graduationYear: studentProfile.graduationYear,
              gpa: studentProfile.cgpa,
              skills: studentProfile.skills || [],
              score: assessmentScore,
              trainingProgress: trainingProgress,
              role: drive.title,
              status: app.status,
              notes: app.notes || '',
              feedback: app.feedback || ''
            });
          }
        }
      }
    }
  }

  return candidatesList;
};

const updateCandidateStatus = async (companyUserId, candidateId, status) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  let updated = false;
  const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives || []));

  for (const drive of drivesCopy) {
    if (drive.applicants && Array.isArray(drive.applicants)) {
      const applicant = drive.applicants.find(a => String(a.student) === String(candidateId));
      if (applicant) {
        applicant.status = status;
        updated = true;
      }
    }
  }

  if (updated) {
    companyProfile.drives = drivesCopy;
    await companyProfile.save();

    // Auto-create default offer if status updated to Offered
    if (status === 'Offered') {
      const companyOfferService = require('./companyOffer.service');
      const studentProfile = await StudentProfile.findOne({ where: { userId: candidateId } });
      if (studentProfile) {
        const hasOffer = studentProfile.offers && studentProfile.offers.some(o => String(o.companyId) === String(companyUserId));
        if (!hasOffer) {
          await companyOfferService.createOffer(companyUserId, {
            candidateId,
            package: '₹12 LPA',
            joining: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: 'Sent'
          });
        }
      }
    }
  }

  return updated;
};

const moveCandidateStage = async (companyUserId, candidateId, payload) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  let updated = false;
  const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives || []));

  for (const drive of drivesCopy) {
    if (drive.applicants && Array.isArray(drive.applicants)) {
      const applicant = drive.applicants.find(a => String(a.student) === String(candidateId));
      if (applicant) {
        applicant.status = payload.stage;
        applicant.notes = payload.notes || applicant.notes || '';
        updated = true;
      }
    }
  }

  if (updated) {
    companyProfile.drives = drivesCopy;
    await companyProfile.save();

    // Auto-create default offer if status updated to Offered
    if (payload.stage === 'Offered') {
      const companyOfferService = require('./companyOffer.service');
      const studentProfile = await StudentProfile.findOne({ where: { userId: candidateId } });
      if (studentProfile) {
        const hasOffer = studentProfile.offers && studentProfile.offers.some(o => String(o.companyId) === String(companyUserId));
        if (!hasOffer) {
          await companyOfferService.createOffer(companyUserId, {
            candidateId,
            package: '₹12 LPA',
            joining: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: 'Sent'
          });
        }
      }
    }
  }

  return updated;
};

const bulkMoveCandidatesStage = async (companyUserId, ids, stage) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  let updated = false;
  const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives || []));

  for (const drive of drivesCopy) {
    if (drive.applicants && Array.isArray(drive.applicants)) {
      drive.applicants.forEach(applicant => {
        if (ids.map(String).includes(String(applicant.student))) {
          applicant.status = stage;
          updated = true;
        }
      });
    }
  }

  if (updated) {
    companyProfile.drives = drivesCopy;
    await companyProfile.save();

    if (stage === 'Offered') {
      const companyOfferService = require('./companyOffer.service');
      for (const candidateId of ids) {
        const studentProfile = await StudentProfile.findOne({ where: { userId: candidateId } });
        if (studentProfile) {
          const hasOffer = studentProfile.offers && studentProfile.offers.some(o => String(o.companyId) === String(companyUserId));
          if (!hasOffer) {
            await companyOfferService.createOffer(companyUserId, {
              candidateId,
              package: '₹12 LPA',
              joining: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              status: 'Sent'
            });
          }
        }
      }
    }
  }

  return updated;
};

module.exports = {
  getCandidatesByCompany,
  updateCandidateStatus,
  moveCandidateStage,
  bulkMoveCandidatesStage
};
