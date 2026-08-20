const express = require('express');
const router = express.Router();
const {
  listCompanies,
  approveCompany,
  createRecruitmentDrive,
  listDrives,
  applyToDrive,
  scheduleInterview,
  updateInterview,
  listInterviews,
  getInterview,
  deleteInterview,
  getCompanySettings,
  updateCompanySettings,
  getCompanyCandidates,
  getCompanyCandidateById,
  shortlistCandidate,
  rejectCandidate,
  moveCandidateStage,
  bulkShortlistCandidates,
  bulkRejectCandidates,
  bulkMoveCandidatesStage,
  getCompanyOffers,
  createCompanyOffer,
  updateCompanyOfferStatus,
  deleteCompanyOffer,
  getCompanyDashboardStats,
  getCompanyDashboardFunnel,
  getCompanyDashboardCollegeStats,
  getCompanyDashboardActivity
} = require('../controllers/company.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), listCompanies);
router.put('/:id/approve', protect, authorize('admin'), approveCompany);
router.post('/drive', protect, authorize('company'), createRecruitmentDrive);
router.get('/drives', protect, listDrives);
router.post('/drives/:id/apply', protect, authorize('student'), applyToDrive);

// Settings routes
router.get('/settings', protect, authorize('company'), getCompanySettings);
router.put('/settings', protect, authorize('company'), updateCompanySettings);

// Candidate management routes
router.get('/candidates', protect, authorize('company'), getCompanyCandidates);
router.get('/candidates/:id', protect, authorize('company'), getCompanyCandidateById);
router.patch('/candidates/:id/shortlist', protect, authorize('company'), shortlistCandidate);
router.patch('/candidates/:id/reject', protect, authorize('company'), rejectCandidate);
router.patch('/candidates/:id/movestage', protect, authorize('company'), moveCandidateStage);
router.patch('/candidates/bulk-shortlist', protect, authorize('company'), bulkShortlistCandidates);
router.patch('/candidates/bulk-reject', protect, authorize('company'), bulkRejectCandidates);
router.patch('/candidates/bulk-movestage', protect, authorize('company'), bulkMoveCandidatesStage);

// Offer management routes
router.get('/offers', protect, authorize('company'), getCompanyOffers);
router.post('/offers', protect, authorize('company'), createCompanyOffer);
router.patch('/offers/:id/status', protect, authorize('company'), updateCompanyOfferStatus);
router.delete('/offers/:id', protect, authorize('company'), deleteCompanyOffer);

// Dashboard routes
router.get('/dashboard/stats', protect, authorize('company'), getCompanyDashboardStats);
router.get('/dashboard/funnel', protect, authorize('company'), getCompanyDashboardFunnel);
router.get('/dashboard/college-stats', protect, authorize('company'), getCompanyDashboardCollegeStats);
router.get('/dashboard/activity', protect, authorize('company'), getCompanyDashboardActivity);

// Interview management routes
router.post('/interview', protect, authorize('company', 'admin'), scheduleInterview);
router.post('/interviews', protect, authorize('company', 'admin'), scheduleInterview);
router.get('/interviews', protect, authorize('company', 'admin', 'student'), listInterviews);
router.get('/interview', protect, authorize('company', 'admin', 'student'), listInterviews);
router.get('/interview/:id', protect, authorize('company', 'admin', 'student'), getInterview);
router.get('/interviews/:id', protect, authorize('company', 'admin', 'student'), getInterview);
router.put('/interview/:id', protect, authorize('company', 'admin'), updateInterview);
router.put('/interviews/:id', protect, authorize('company', 'admin'), updateInterview);
router.delete('/interview/:id', protect, authorize('company', 'admin'), deleteInterview);
router.delete('/interviews/:id', protect, authorize('company', 'admin'), deleteInterview);

module.exports = router;


