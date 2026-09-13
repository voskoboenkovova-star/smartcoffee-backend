let orders = [];
let orderIdCounter = 100;

// POST /api/v1/orders — Створення замовлення з валідацією
exports.createOrder = (req, res) => {
  const { customerName, items, pickUpTime } = req.body;

  // 1. Валідація даних
  if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
    return res.status(400).json({ success: false, error: "Ім'я замовника обов'язкове" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Замовлення повинно містити хоча б один товар' });
  }

  // 2. Створення об'єкта замовлення
  const newOrder = {
    id: ++orderIdCounter,
    customerName: customerName.trim(),
    items,
    totalPrice: items.reduce((sum, item) => sum + item.price, 0),
    status: 'Прийнято', // Статуси: Прийнято -> Готується -> Готово -> Видано
    pickUpTime: pickUpTime || 'На зараз',
    createdAt: new Date().toLocaleTimeString(),
    timerExpireAt: null
  };

  orders.push(newOrder);

  // 3. Відправляємо через WebSockets нове замовлення на Панель Бариста у реальному часі!
  const io = req.app.get('socketio');
  io.emit('new_order_to_kds', newOrder);

  return res.status(201).json({
    success: true,
    message: 'Замовлення успішно створено!',
    data: newOrder
  });
};

// PATCH /api/v1/orders/:id/status — Зміна статусу замовлення (Бариста)
exports.updateOrderStatus = (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;
  
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Замовлення не знайдено' });
  }

  order.status = status;

  // Якщо статус "Готово" — запускаємо смарт-таймер утилізації (15 хвилин)
  if (status === 'Готово') {
    const expireTime = new Date(Date.now() + 15 * 60 * 1000);
    order.timerExpireAt = expireTime.toLocaleTimeString();
  }

  // Сповіщаємо всі клієнтські екрани
  const io = req.app.get('socketio');
  io.emit('order_status_changed', order);

  res.status(200).json({ success: true, data: order });
};