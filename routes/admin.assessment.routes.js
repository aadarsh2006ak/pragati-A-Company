const express = require('express');
const router = express.Router();
const {
  createAssessment,
  listAssessments,
  submitAssessment
} = require('../controllers/admin.assessment');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('admin', 'mentor'), createAssessment);
router.get('/', protect, listAssessments);
router.post('/submit', protect, authorize('student'), submitAssessment);

module.exports = router;
