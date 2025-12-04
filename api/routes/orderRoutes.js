const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(protect);

router.route('/')
  .get(getMyOrders)
  .post(createOrder);

router.get('/admin/all', authorize('admin'), getAllOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

module.exports = router;

