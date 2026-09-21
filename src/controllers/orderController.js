const orderService = require('../services/orderService');

// GET /api/v1/orders — Отримання списку всіх замовлень
exports.getOrders = (req, res) => {
  try {
    const orders = orderService.getAllOrders();
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/v1/orders — Створення замовлення
exports.createOrder = (req, res) => {
  try {
    const io = req.io || req.app.get('socketio') || req.app.get('io');
    const newOrder = orderService.createNewOrder(req.body, io);

    return res.status(201).json({
      success: true,
      message: 'Замовлення успішно створено!',
      data: newOrder
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// PATCH /api/v1/orders/:id/status — Зміна статусу замовлення
exports.updateOrderStatus = (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    const io = req.io || req.app.get('socketio') || req.app.get('io');
    const updatedOrder = orderService.updateStatus(orderId, status, io);

    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (err) {
    const statusCode = err.message === 'Замовлення не знайдено' ? 404 : 400;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};