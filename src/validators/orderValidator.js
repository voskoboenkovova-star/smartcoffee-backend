const Joi = require('joi');

// Схема перевірки для створення замовлення
const createOrderSchema = Joi.object({
  id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  customerName: Joi.string().trim().optional(),
  userName: Joi.string().trim().optional(),
  items: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
      name: Joi.string().required(),
      price: Joi.number().min(0).required(),
      quantity: Joi.number().integer().min(1).required(),
      size: Joi.string().optional(),
      milkName: Joi.string().optional(),
      isFreeBonus: Joi.boolean().optional()
    })
  ).min(1).required().messages({
    'array.min': 'Замовлення повинно містити хоча б один товар',
    'any.required': 'Список товарів є обов\'язковим'
  }),
  pickUpTime: Joi.string().optional(),
  paymentMethod: Joi.string().valid('card', 'cash').optional(),
  comment: Joi.string().allow('').optional(),
  totalPrice: Joi.number().min(0).optional(),
  totalAmount: Joi.number().min(0).optional()
}).or('customerName', 'userName').messages({
  'object.missing': 'Поле \'customerName\' або \'userName\' є обов\'язковим'
});

// Middleware для валідації створення замовлення
const validateCreateOrder = (req, res, next) => {
  const { error } = createOrderSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      success: false,
      error: `Помилка валідації: ${errorMessage}`
    });
  }
  
  next();
};

// Схема перевірки для зміни статусу
const updateStatusSchema = Joi.object({
  status: Joi.string().required().messages({
    'any.required': 'Статус замовлення є обов\'язковим'
  })
});

// Middleware для валідації зміни статусу
const validateUpdateStatus = (req, res, next) => {
  const { error } = updateStatusSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Помилка валідації: ${error.details[0].message}`
    });
  }
  
  next();
};

module.exports = {
  validateCreateOrder,
  validateUpdateStatus
};