const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Зв'язок із накидом фронтенду

// Зберігаємо Socket.io в об'єкті app для використання в контролерах
app.set('socketio', io);

// Підключення роутів API (Префікс /api/v1)
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', orderRoutes);

// Socket.io реальний час
io.on('connection', (socket) => {
  console.log(`🔌 Нове підключення клієнта: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Клієнт відключився: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Back-end сервер «SmartCoffee Express» запущено на http://localhost:${PORT}`);
});