const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// 1. Отримання всього меню (GET)
router.get('/', menuController.getMenu);

// 2. Створення нової позиції в меню (POST)
if (menuController.createMenuItem) {
  router.post('/', menuController.createMenuItem);
} else if (menuController.addMenuItem) {
  router.post('/', menuController.addMenuItem);
}

// 3. Оновлення позиції (PUT / PATCH)
if (menuController.updateMenuItem) {
  router.put('/:id', menuController.updateMenuItem);
  router.patch('/:id', menuController.updateMenuItem);
}

// 4. Видалення позиції (DELETE)
if (menuController.deleteMenuItem) {
  router.delete('/:id', menuController.deleteMenuItem);
}

// Обов'язковий експорт роутера для Express
module.exports = router;