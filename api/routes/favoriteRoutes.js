const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  checkFavorite
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(protect);

router.route('/')
  .get(getFavorites)
  .post(addFavorite);

router.delete('/:productId', removeFavorite);
router.post('/toggle/:productId', toggleFavorite);
router.get('/check/:productId', checkFavorite);

module.exports = router;

