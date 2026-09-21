// Начальный массив с тестовым заказом для пользователя "Лёша"
let orders = [
  {
    id: 101,
    customerName: "Лёша",
    userName: "Лёша",
    items: [{ name: "Еспресо", price: 45, quantity: 1 }],
    totalPrice: 45,
    status: "pending",
    statusText: "Прийнято",
    pickUpTime: "На зараз",
    createdAt: "18:30:00",
    createdAtTimestamp: Date.now()
  }
];

let orderIdCounter = 101;

// GET /api/v1/orders — Отримання списку всіх замовлень
exports.getOrders = (req, res) => {
  // Возвращаем чистый массив, чтобы фронтенд сразу его принимал
  return res.status(200).json(orders);
};

// POST /api/v1/orders — Створення замовлення
exports.createOrder = (req, res) => {
  const { customerName, userName, items, pickUpTime, paymentMethod, comment, totalPrice, totalAmount } = req.body;

  const clientName = customerName || userName;

  if (!clientName || typeof clientName !== 'string' || clientName.trim() === '') {
    return res.status(400).json({ success: false, error: "Ім'я замовника обов'язкове" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Замовлення повинно містити хоча б один товар' });
  }

  const calculatedTotal = totalPrice || totalAmount || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const newOrder = {
    id: req.body.id || ++orderIdCounter,
    customerName: clientName.trim(),
    userName: clientName.trim(),
    items,
    totalPrice: calculatedTotal,
    totalAmount: calculatedTotal,
    paymentMethod: paymentMethod || 'card',
    comment: comment || '',
    status: 'pending',
    statusText: 'Прийнято',
    pickUpTime: pickUpTime || 'На зараз',
    createdAt: new Date().toLocaleTimeString(),
    createdAtTimestamp: Date.now(),
    timerExpireAt: null
  };

  orders.push(newOrder);

  // Відправляємо на всі екрани через WebSockets
  const io = req.io || req.app.get('socketio') || req.app.get('io');
  if (io) {
    io.emit('new_order_to_kds', newOrder);
    io.emit('newOrder', newOrder);
    io.emit('new_order', newOrder);
    io.emit('order_created', newOrder);
  }

  return res.status(201).json({
    success: true,
    message: 'Замовлення успішно створено!',
    data: newOrder
  });
};

// PATCH /api/v1/orders/:id/status — Зміна статусу замовлення
exports.updateOrderStatus = (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;
  
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Замовлення не знайдено' });
  }

  order.status = status;

  if (status === 'Готово' || status === 'ready') {
    const expireTime = new Date(Date.now() + 15 * 60 * 1000);
    order.timerExpireAt = expireTime.toLocaleTimeString();
  }

  const io = req.io || req.app.get('socketio') || req.app.get('io');
  if (io) {
    io.emit('order_status_changed', order);
    io.emit('update_order_status', order);
  }

  res.status(200).json({ success: true, data: order });
};