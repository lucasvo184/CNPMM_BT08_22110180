const express = require('express');
const router = express.Router();
const {
  getViewHistory,
  recordView,
  removeFromHistory,
  clearHistory,
  getRecentViewed
} = require('../controllers/viewHistoryController');
const { protect } = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(protect);

router.route('/')
  .get(getViewHistory)
  .post(recordView)
  .delete(clearHistory);

router.get('/recent', getRecentViewed);
router.delete('/:productId', removeFromHistory);

module.exports = router;

