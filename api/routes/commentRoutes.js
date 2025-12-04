const express = require('express');
const router = express.Router();
const {
  getProductComments,
  addComment,
  updateComment,
  deleteComment,
  toggleLikeComment,
  getMyComments
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Public route
router.get('/product/:productId', getProductComments);

// Protected routes
router.post('/', protect, addComment);
router.get('/my-comments', protect, getMyComments);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleLikeComment);

module.exports = router;

