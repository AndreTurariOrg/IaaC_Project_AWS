import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', apellidos: '', direccion: '', telefono: '' });
  const [editando, setEditando] = useState(null);
  const [editCliente, setEditCliente] = useState({ nombre: '', apellidos: '', direccion: '', telefono: '', activo: true });
  const [showEditModal, setShowEditModal] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

  useEffect(() => {
    api.get('/clientes-todos').then(res => setClientes(res.data));
  }, []);

  useEffect(() => {
    if (notificacion.mensaje) {
      const timer = setTimeout(() => {
        setNotificacion({ mensaje: '', tipo: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setNuevoCliente({ nombre: '', apellidos: '', direccion: '', telefono: '' });
  };

  const handleGuardarCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.apellidos) return;
    try {
      const res = await api.post('/clientes', nuevoCliente);
      if (res.data && res.data.id_cliente) {
        api.get('/clientes').then(r => setClientes(r.data));
        handleCloseModal();
      }
    } catch {}
  };

  const handleEditarCliente = (cliente) => {
    setEditando(cliente.id_cliente);
    setEditCliente({
      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || '',
      activo: !!cliente.activo
    });
    setShowEditModal(true);
  };

  const handleGuardarEdicion = async () => {
    if (!editCliente.nombre || !editCliente.apellidos) {
      setNotificacion({ mensaje: 'Nombre y apellidos son obligatorios.', tipo: 'error' });
      return;
    }
    try {
  await api.put(`/clientes/${editando}`, editCliente);
  setNotificacion({ mensaje: 'Cliente actualizado correctamente.', tipo: 'success' });
  api.get('/clientes-todos').then(r => setClientes(r.data));
  setEditando(null);
  setShowEditModal(false);
    } catch (err) {
      setNotificacion({ mensaje: 'Error al actualizar cliente.', tipo: 'error' });
    }
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
    setShowEditModal(false);
  };

  const clientesFiltrados = clientes.filter(c =>
    (c.nombre + ' ' + c.apellidos).toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', marginLeft: '240px', padding: '40px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontWeight: 'bold', fontSize: '2rem', color: '#222', margin: 0 }}>Clientes</h1>
            <button type='button' onClick={handleOpenModal} style={{ background: '#1abc5b', color: '#fff', fontWeight: 'bold', fontSize: '1rem', padding: '10px 24px', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(26,188,91,0.07)' }}>
              + Agregar Cliente
            </button>
          </div>
          <div style={{ marginBottom: '18px' }}>
            <input type='text' placeholder='Buscar clientes...' value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>NOMBRE</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>APELLIDOS</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>DIRECCIÓN</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>TELÉFONO</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>ESTADO</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: '#888' }}>No hay clientes</td></tr>
              ) : (
                clientesFiltrados.map(c => (
                  <tr key={c.id_cliente}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#222' }}>{c.nombre}</td>
                    <td style={{ padding: '10px', color: '#222' }}>{c.apellidos}</td>
                    <td style={{ padding: '10px', color: '#222' }}>{c.direccion || '-'}</td>
                    <td style={{ padding: '10px', color: '#222' }}>{c.telefono || '-'}</td>
                    <td style={{ padding: '10px', color: c.activo ? '#1abc5b' : '#e53935', fontWeight: 'bold' }}>{c.activo ? 'Activo' : 'Inactivo'}</td>
                    <td style={{ padding: '10px', color: '#222' }}>
                      <span style={{ color: '#2196f3', cursor: 'pointer', marginRight: '12px', fontWeight: 'bold' }} onClick={() => handleEditarCliente(c)}>✎ Editar</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '400px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#888', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Agregar Cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Nombre</label>
              <input type='text' placeholder='Nombre' value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Apellidos</label>
              <input type='text' placeholder='Apellidos' value={nuevoCliente.apellidos} onChange={e => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Dirección (opcional)</label>
              <input type='text' placeholder='Dirección (opcional)' value={nuevoCliente.direccion} onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Teléfono (opcional)</label>
              <input type='text' placeholder='Teléfono (opcional)' value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button type='button' onClick={handleCloseModal} style={{ background: '#f5f5f5', color: '#222', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancelar</button>
              <button type='button' onClick={handleGuardarCliente} style={{ background: '#1abc5b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '400px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={handleCancelarEdicion} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#888', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Editar Cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Nombre</label>
              <input type='text' placeholder='Nombre' value={editCliente.nombre} onChange={e => setEditCliente({ ...editCliente, nombre: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Apellidos</label>
              <input type='text' placeholder='Apellidos' value={editCliente.apellidos} onChange={e => setEditCliente({ ...editCliente, apellidos: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Dirección (opcional)</label>
              <input type='text' placeholder='Dirección (opcional)' value={editCliente.direccion} onChange={e => setEditCliente({ ...editCliente, direccion: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Teléfono (opcional)</label>
              <input type='text' placeholder='Teléfono (opcional)' value={editCliente.telefono} onChange={e => setEditCliente({ ...editCliente, telefono: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#222' }}>
                Estado:
                <label style={{ marginLeft: '16px', marginRight: '12px' }}>
                  <input type='radio' name='estado' checked={editCliente.activo === true} onChange={() => setEditCliente({ ...editCliente, activo: true })} /> Activo
                </label>
                <label>
                  <input type='radio' name='estado' checked={editCliente.activo === false} onChange={() => setEditCliente({ ...editCliente, activo: false })} /> Inactivo
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button type='button' onClick={handleCancelarEdicion} style={{ background: '#f5f5f5', color: '#222', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancelar</button>
              <button type='button' onClick={handleGuardarEdicion} style={{ background: '#1abc5b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {notificacion.mensaje && (
        <div style={{
          position: 'fixed',
          left: '32px',
          bottom: '32px',
          zIndex: 9999,
          minWidth: '260px',
          padding: '16px 24px',
          borderRadius: '8px',
          background: notificacion.tipo === 'error' ? '#ffeaea' : '#eaffea',
          color: notificacion.tipo === 'error' ? '#e53935' : '#1abc5b',
          fontWeight: 'bold',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          fontSize: '1rem',
          animation: 'fadeIn 0.3s',
        }}>
          {notificacion.mensaje}
        </div>
      )}
    </div>
  );
};

export default Clientes;
