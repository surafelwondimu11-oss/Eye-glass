const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const {
  createCheckoutSession,
  confirmCheckoutSession,
  getAdminAnalytics,
  getAdminOrders,
  bulkUpdateAdminOrderStatus,
  updateAdminOrderStatus,
} = require('../controllers/paymentController');

router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/confirm/:sessionId', protect, confirmCheckoutSession);
router.get('/admin/analytics', protect, admin, getAdminAnalytics);
router.get('/admin/orders', protect, admin, getAdminOrders);
router.put('/admin/orders/bulk-status', protect, admin, bulkUpdateAdminOrderStatus);
router.put('/admin/orders/:orderId/status', protect, admin, updateAdminOrderStatus);

module.exports = router;
