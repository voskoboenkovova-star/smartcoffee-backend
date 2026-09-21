const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateCreateOrder, validateUpdateStatus } = require('../validators/orderValidator');

// POST /api/v1/orders — Створення замовлення (з перевіркою за схемою Joi)
router.post('/', validateCreateOrder, orderController.createOrder);

// PATCH /api/v1/orders/:id/status — Зміна статусу замовлення (з перевіркою статусу)
router.patch('/:id/status', validateUpdateStatus, orderController.updateOrderStatus);

module.exports = router;