import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import BaristaScreen from './BaristaScreen.jsx';
import AdminScreen from './AdminScreen.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Публічна сторінка для гостей */}
        <Route path="/" element={<App />} />

        {/* ПРИХОВАНІ СЕКРЕТНІ ШЛЯХИ */}
        <Route path="/barista-secret-portal-777" element={<BaristaScreen />} />
        <Route path="/admin-control-panel-99" element={<AdminScreen />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);