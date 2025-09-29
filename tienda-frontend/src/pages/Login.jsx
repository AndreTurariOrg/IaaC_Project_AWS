import React, { useState } from 'react';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/login', { nombre, contrasena });
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      onLogin();
    } catch (err) {
      const message = err.response?.data?.mensaje || 'Error al iniciar sesion';
      setError(message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 32px #0001', minWidth: 350 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Sistema Bodega JA</h2>
        <div style={{ textAlign: 'center', color: '#888', marginBottom: 24 }}>Inicie sesion para continuar</div>
        <div style={{ marginBottom: 16 }}>
          <label>Usuario</label>
          <input type='text' value={nombre} onChange={(e) => setNombre(e.target.value)} className='input' style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label>Contrasena</label>
          <input type='password' value={contrasena} onChange={(e) => setContrasena(e.target.value)} className='input' style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type='submit' style={{ width: '100%', background: '#16c784', color: '#fff', border: 'none', padding: 12, borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default Login;
