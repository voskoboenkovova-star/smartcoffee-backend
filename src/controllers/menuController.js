// Початковий список товарів
let menuData = [
  // --- НАПОЇ: ГАРЯЧІ ---
  {
    id: '1',
    name: 'Еспресо',
    category: 'drinks',
    subCategory: 'hot',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&q=80',
    description: 'Класичний насичений еспресо з оксамитовою пінкою',
    prices: { small: 45, medium: 55, large: 65 },
    price: 45,
    isAvailable: true,
    hasMilkOptions: false
  },
  {
    id: '2',
    name: 'Капучино',
    category: 'drinks',
    subCategory: 'hot',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&q=80',
    description: 'Еспресо з ніжним збитим молоком та молочною пінкою',
    prices: { small: 60, medium: 75, large: 90 },
    price: 60,
    isAvailable: true,
    hasMilkOptions: true
  },
  {
    id: '3',
    name: 'Лате',
    category: 'drinks',
    subCategory: 'hot',
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&q=80',
    description: 'М’який кавовий напій з більшою кількістю молока',
    prices: { small: 65, medium: 80, large: 95 },
    price: 65,
    isAvailable: true,
    hasMilkOptions: true
  },

  // --- НАПОЇ: ХОЛОДНІ ---
  {
    id: '4',
    name: 'Айс Лате',
    category: 'drinks',
    subCategory: 'cold',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    description: 'Освіжаючий холодний лате з кубиками льоду',
    prices: { small: 70, medium: 85, large: 100 },
    price: 70,
    isAvailable: true,
    hasMilkOptions: true
  },
  {
    id: '5',
    name: 'Джміль (Bumble Coffee)',
    category: 'drinks',
    subCategory: 'cold',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80',
    description: 'Яскравий мікс карамельного сиропу, апельсинового соку та еспресо',
    prices: { small: 85, medium: 100, large: 115 },
    price: 85,
    isAvailable: true,
    hasMilkOptions: false
  },

  // --- СТРАВИ: ДЕСЕРТИ ---
  {
    id: '6',
    name: 'Мигдалевий Круасан',
    category: 'food',
    subCategory: 'dessert',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
    description: 'Хрусткий французький круасан з мигдалевим кремом та пелюстками',
    price: 85,
    stock: 10,
    isAvailable: true
  },
  {
    id: '7',
    name: 'Чізкейк Нью-Йорк',
    category: 'food',
    subCategory: 'dessert',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80',
    description: 'Ніжний сирний десерт на пісочній основі',
    price: 95,
    stock: 8,
    isAvailable: true
  },

  // --- СТРАВИ: ЛАНЧІ ---
  {
    id: '8',
    name: 'Сендвіч з куркою та песто',
    category: 'food',
    subCategory: 'lunch',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80',
    description: 'Соковите куряче філе, соус песто, свіжий томат та сир моцарела',
    price: 130,
    stock: 5,
    isAvailable: true
  },
  {
    id: '9',
    name: 'Паніні з шинкою та сиром',
    category: 'food',
    subCategory: 'lunch',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80',
    description: 'Гарячий грильований паніні з соковитою шинкою та розплавленим сиром',
    price: 115,
    stock: 7,
    isAvailable: true
  }
];

// 1. Отримання всього меню (GET /api/v1/menu)
exports.getMenu = (req, res) => {
  res.json(menuData);
};

// 2. Додавання нової позиції (POST /api/v1/menu)
exports.createMenuItem = (req, res) => {
  try {
    const newItem = {
      id: Date.now().toString(),
      isAvailable: true,
      ...req.body
    };

    menuData.push(newItem);

    if (req.io) {
      req.io.emit('menuUpdated', newItem);
    }

    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: 'Помилка створення позиції', error: err.message });
  }
};

// 3. Оновлення позиції (PUT/PATCH /api/v1/menu/:id)
exports.updateMenuItem = (req, res) => {
  try {
    const { id } = req.params;
    const index = menuData.findIndex((item) => String(item.id) === String(id) || String(item._id) === String(id));

    if (index !== -1) {
      menuData[index] = { ...menuData[index], ...req.body };
      return res.status(200).json(menuData[index]);
    }

    res.status(404).json({ message: 'Позицію не знайдено' });
  } catch (err) {
    res.status(400).json({ message: 'Помилка оновлення', error: err.message });
  }
};

// 4. Видалення позиції (DELETE /api/v1/menu/:id)
exports.deleteMenuItem = (req, res) => {
  try {
    const { id } = req.params;
    menuData = menuData.filter((item) => String(item.id) !== String(id) && String(item._id) !== String(id));
    res.status(200).json({ message: 'Позицію успішно видалено' });
  } catch (err) {
    res.status(400).json({ message: 'Помилка видалення', error: err.message });
  }
};