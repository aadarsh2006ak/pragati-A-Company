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
  deleteInterview
} = require('../controllers/company.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), listCompanies);
router.put('/:id/approve', protect, authorize('admin'), approveCompany);
router.post('/drive', protect, authorize('company'), createRecruitmentDrive);
router.get('/drives', protect, listDrives);
router.post('/drives/:id/apply', protect, authorize('student'), applyToDrive);

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

