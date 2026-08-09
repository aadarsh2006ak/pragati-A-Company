const express = require('express');
const router = express.Router();
const {
  listColleges,
  verifyStudentProfile,
  registerStudentRoster
} = require('../controllers/admin.college');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), listColleges);
router.post('/verify', protect, authorize('admin', 'college'), verifyStudentProfile);
router.post('/roster', protect, authorize('college'), registerStudentRoster);

module.exports = router;
