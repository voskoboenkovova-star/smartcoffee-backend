// Початковий масив з тестовим замовленням
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

// Сервіс для отримання замовлень
const getAllOrders = () => {
  return orders;
};

// Сервіс для створення замовлення
const createNewOrder = (orderData, io) => {
  const { customerName, userName, items, pickUpTime, paymentMethod, comment, totalPrice, totalAmount } = orderData;
  const clientName = customerName || userName;

  if (!clientName || typeof clientName !== 'string' || clientName.trim() === '') {
    throw new Error("Ім'я замовника обов'язкове");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Замовлення повинно містити хоча б один товар');
  }

  const calculatedTotal = totalPrice || totalAmount || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const newOrder = {
    id: orderData.id || ++orderIdCounter,
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

  // Відправка через WebSockets, якщо він доступний
  if (io) {
    io.emit('new_order_to_kds', newOrder);
    io.emit('newOrder', newOrder);
    io.emit('new_order', newOrder);
    io.emit('order_created', newOrder);
  }

  return newOrder;
};

// Сервіс для оновлення статусу замовлення
const updateStatus = (orderId, status, io) => {
  const order = orders.find(o => o.id === Number(orderId));
  if (!order) {
    throw new Error('Замовлення не знайдено');
  }

  order.status = status;

  if (status === 'Готово' || status === 'ready') {
    const expireTime = new Date(Date.now() + 15 * 60 * 1000);
    order.timerExpireAt = expireTime.toLocaleTimeString();
  }

  if (io) {
    io.emit('order_status_changed', order);
    io.emit('update_order_status', order);
  }

  return order;
};

module.exports = {
  getAllOrders,
  createNewOrder,
  updateStatus
};