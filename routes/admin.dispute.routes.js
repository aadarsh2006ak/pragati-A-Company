const express = require('express');
const router = express.Router();
const {
  createDispute,
  listDisputes,
  resolveDispute
} = require('../controllers/admin.dispute');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('student'), createDispute);
router.get('/', protect, authorize('admin', 'student'), listDisputes);
router.put('/:id/resolve', protect, authorize('admin'), resolveDispute);

module.exports = router;
