import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

const navStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '240px',
  height: '100vh',
  background: '#232c36',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '2px 0 8px rgba(0,0,0,0.07)',
  zIndex: 100
};

const logoStyle = {
  fontWeight: 'bold',
  fontSize: '1.3rem',
  padding: '24px 0 8px 32px',
  letterSpacing: '1px'
};

const versionStyle = {
  fontSize: '0.9rem',
  color: '#b0b8c1',
  paddingLeft: '32px',
  marginBottom: '18px'
};

const ulStyle = {
  listStyleType: 'none',
  padding: 0,
  margin: 0,
  flex: 1
};

const liStyle = {
  margin: 0
};

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '16px 32px',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '1.05rem',
  transition: 'background 0.2s'
};

const activeLinkStyle = {
  background: '#1abc5b',
  color: '#fff',
  borderRadius: '6px 0 0 6px'
};

const Navbar = () => {
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.warn('Logout failed:', err.message);
    }
    localStorage.removeItem('usuario');
    window.location.reload();
  };

  const links = [
    { to: '/ventas', label: 'Ventas' },
    { to: '/productos', label: 'Productos' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/reportes', label: 'Reportes' }
  ];

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>Sistema Bodega JA</div>
      <div style={versionStyle}>v1.0.0</div>
      <ul style={ulStyle}>
        {links.map(({ to, label }) => (
          <li key={to} style={liStyle}>
            <Link to={to} style={{ ...linkStyle, ...(location.pathname === to ? activeLinkStyle : {}) }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div style={{ padding: '16px 32px', borderTop: '1px solid #2e3742', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ background: '#1abc5b', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '10px' }}>
            {usuario?.nombre?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{usuario?.nombre || 'Usuario'}</div>
            <div style={{ fontSize: '0.85rem', color: '#b0b8c1' }}>Sesion activa</div>
          </div>
        </div>
        <button onClick={handleLogout} title='Cerrar sesion' style={{ marginLeft: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='#888' viewBox='0 0 24 24'>
            <path d='M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8c-1.1 0-2 .9-2 2v4h2V5h8v14h-8v-4h-2v4c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z'/>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
