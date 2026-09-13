// Тестові дані меню (імітація бази даних, якщо PostgreSQL ще не заповнена)
let menuItems = [
  { id: 1, name: 'Еспресо', price: 45, category: 'Кава', inStock: true },
  { id: 2, name: 'Капучино', price: 65, category: 'Кава', inStock: true },
  { id: 3, name: 'Лате', price: 70, category: 'Кава', inStock: true },
  { id: 4, name: ' Круасан з мигдалем', price: 85, category: 'Випічка', inStock: false }
];

// GET /api/v1/menu — Отримання каталогу
exports.getMenu = (req, res) => {
  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems
  });
};

// PATCH /api/v1/menu/:id/toggle-stock — Перемикання стоп-листа (для Бариста)
exports.toggleStock = (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = menuItems.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Товар не знайдено' });
  }

  item.inStock = !item.inStock;
  
  // Оповіщаємо всіх клієнтів через WebSockets про зміну стоп-листа
  const io = req.app.get('socketio');
  io.emit('menu_updated', menuItems);

  res.status(200).json({
    success: true,
    message: `Статус товару ${item.name} змінено на ${item.inStock ? 'В наявності' : 'В стоп-листі'}`,
    data: item
  });
};