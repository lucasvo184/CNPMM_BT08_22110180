const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getSimilarProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/:id', optionalAuth, getProduct);
router.get('/:id/similar', getSimilarProducts);
router.get('/:id/stats', getProductStats);

// Admin routes
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;

