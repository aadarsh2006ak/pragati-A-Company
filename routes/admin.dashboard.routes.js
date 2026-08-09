const express = require('express');
const router = express.Router();
const { getSystemStats } = require('../controllers/admin.dashboard');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), getSystemStats);

module.exports = router;
