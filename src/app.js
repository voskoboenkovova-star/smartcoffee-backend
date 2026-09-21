const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Зберігаємо io в Express, щоб контролери мали до нього доступ через req.app.get(...)
app.set('io', io);
app.set('socketio', io);

// 1. Дозволяємо CORS запити з фронтенду
app.use(cors());

// 2. Збільшуємо ліміт прийому даних до 50mb для фото у форматі Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Передаємо об'єкт io у запити
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', orderRoutes);

// Роздача статичних файлів з папки public (згенерований React-білд)
app.use(express.static(path.join(__dirname, '../public')));

// Усі інші GET-запити перенаправляємо на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSockets події
io.on('connection', (socket) => {
  console.log('Нове підключення клієнта:', socket.id);

  socket.on('disconnect', () => {
    console.log('Клієнт відключився:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Back-end сервер «SmartCoffee Express» запущено на http://localhost:${PORT}`);
});