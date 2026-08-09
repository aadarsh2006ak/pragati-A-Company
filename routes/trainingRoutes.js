const express = require('express');
const router = express.Router();
const {
  createCourse,
  listCourses,
  submitAssignment
} = require('../controllers/training.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/course', protect, authorize('mentor', 'admin'), createCourse);
router.get('/courses', protect, listCourses);
router.post('/assignment/submit', protect, authorize('student'), submitAssignment);

module.exports = router;
