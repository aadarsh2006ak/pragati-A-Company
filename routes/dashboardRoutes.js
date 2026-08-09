const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/student.dashboard');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('student'), getDashboardStats);

module.exports = router;
