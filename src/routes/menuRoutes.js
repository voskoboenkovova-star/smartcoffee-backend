const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.getMenu);
router.patch('/:id/toggle-stock', menuController.toggleStock);

module.exports = router;