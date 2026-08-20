const CompanyProfile = require('../models/CompanyProfile');
const StudentProfile = require('../models/StudentProfile');
const Interview = require('../models/Interview');
const CollegeProfile = require('../models/CollegeProfile');
const User = require('../models/User');

const getDashboardStats = async (companyUserId) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  const activeDrivesCount = companyProfile.drives 
    ? companyProfile.drives.filter(d => d.status === 'active').length 
    : 0;

  let totalApplications = 0;
  if (companyProfile.drives && Array.isArray(companyProfile.drives)) {
    companyProfile.drives.forEach(drive => {
      if (drive.applicants && Array.isArray(drive.applicants)) {
        totalApplications += drive.applicants.length;
      }
    });
  }

  const interviewsScheduledCount = await Interview.count({
    where: { companyId: companyUserId, status: 'scheduled' }
  });

  const studentProfiles = await StudentProfile.findAll();
  let offersReleasedCount = 0;
  let acceptedOffersCount = 0;

  for (const studentProfile of studentProfiles) {
    if (studentProfile.offers && Array.isArray(studentProfile.offers)) {
      studentProfile.offers.forEach(offer => {
        if (String(offer.companyId) === String(companyUserId)) {
          offersReleasedCount++;
          if (String(offer.status).toLowerCase() === 'accepted') {
            acceptedOffersCount++;
          }
        }
      });
    }
  }

  const hiringSuccessRate = offersReleasedCount > 0 
    ? Math.round((acceptedOffersCount / offersReleasedCount) * 100) 
    : 0;

  return {
    activeDrives: activeDrivesCount,
    totalApplications,
    interviewsScheduled: interviewsScheduledCount,
    offersReleased: offersReleasedCount,
    hiringSuccessRate
  };
};

const getDashboardFunnel = async (companyUserId) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  let applied = 0;
  let screened = 0;
  let trained = 0;
  let shortlisted = 0;
  let selected = 0;

  if (companyProfile.drives && Array.isArray(companyProfile.drives)) {
    companyProfile.drives.forEach(drive => {
      if (drive.applicants && Array.isArray(drive.applicants)) {
        drive.applicants.forEach(app => {
          const status = (app.status || '').toLowerCase();
          if (status === 'applied') {
            applied++;
          } else if (status === 'interview_scheduled' || status === 'interview_completed' || status === 'screened') {
            screened++;
          } else if (status === 'trained') {
            trained++;
          } else if (status === 'shortlisted') {
            shortlisted++;
          } else if (status === 'offered' || status === 'selected' || status === 'accepted') {
            selected++;
          }
        });
      }
    });
  }

  return {
    applied,
    screened,
    trained,
    shortlisted,
    selected
  };
};

const getDashboardCollegeStats = async (companyUserId) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  const collegeCounts = {};

  if (companyProfile.drives && Array.isArray(companyProfile.drives)) {
    for (const drive of companyProfile.drives) {
      if (drive.applicants && Array.isArray(drive.applicants)) {
        for (const app of drive.applicants) {
          const studentProfile = await StudentProfile.findOne({ where: { userId: app.student } });
          if (studentProfile && studentProfile.college) {
            const college = await CollegeProfile.findByPk(studentProfile.college);
            if (college) {
              const name = college.collegeName;
              collegeCounts[name] = (collegeCounts[name] || 0) + 1;
            }
          }
        }
      }
    }
  }

  return Object.keys(collegeCounts).map(name => ({
    collegeName: name,
    candidateCount: collegeCounts[name]
  }));
};

const getDashboardActivity = async (companyUserId) => {
  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  const activities = [];

  if (companyProfile.drives && Array.isArray(companyProfile.drives)) {
    for (const drive of companyProfile.drives) {
      if (drive.applicants && Array.isArray(drive.applicants)) {
        for (const app of drive.applicants) {
          if (app.status !== 'applied') {
            const student = await User.findByPk(app.student);
            if (student) {
              activities.push({
                candidateName: student.name,
                activity: `status updated to ${app.status}`,
                time: app.appliedAt || drive.createdAt || new Date()
              });
            }
          }
        }
      }
    }
  }

  const interviews = await Interview.findAll({
    where: { companyId: companyUserId },
    limit: 10
  });

  for (const interview of interviews) {
    const student = await User.findByPk(interview.studentId);
    if (student) {
      activities.push({
        candidateName: student.name,
        activity: `Interview Scheduled (${interview.round || 'Technical'})`,
        time: interview.createdAt || new Date()
      });
    }
  }

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  return activities.slice(0, 5);
};

module.exports = {
  getDashboardStats,
  getDashboardFunnel,
  getDashboardCollegeStats,
  getDashboardActivity
};
