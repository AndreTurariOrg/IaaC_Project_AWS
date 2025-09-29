import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

import Productos from './pages/Productos';
import Ventas from './pages/Ventas';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import Login from './pages/Login';

import api from './services/api';

const App = () => {
  const [usuario, setUsuario] = useState(() => {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  });
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    api.get('/verificar-sesion', { withCredentials: true })
      .then(res => {
        if (res.data.autenticado && res.data.usuario) {
          setUsuario(res.data.usuario);
          localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        } else {
          setUsuario(null);
          localStorage.removeItem('usuario');
        }
        setVerificando(false);
      })
      .catch(() => {
        setUsuario(null);
        localStorage.removeItem('usuario');
        setVerificando(false);
      });
  }, []);

  const handleLogin = () => {
    const u = localStorage.getItem('usuario');
    setUsuario(u ? JSON.parse(u) : null);
  };

  if (verificando) {
    return <div style={{textAlign:'center',marginTop:'20vh',fontSize:'1.3rem',color:'#888'}}>Verificando sesión...</div>;
  }

  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/ventas" />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </Router>
  );
};

export default App;