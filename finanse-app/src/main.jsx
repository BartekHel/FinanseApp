import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Main from './pages/Main.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import '../src/styles/style.css';
import '../src/styles/auth.css';
import '../src/styles/dashboard.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route index element={<Main />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="dashboard" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => console.log('SW registered:', reg))
      .catch((err) => console.error('SW registration failed:', err));
  });
}
