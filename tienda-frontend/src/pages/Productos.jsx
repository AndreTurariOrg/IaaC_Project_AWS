import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio: '', stock: '', categoria: '', activo: true });
  const [editando, setEditando] = useState(null);
  const [editProducto, setEditProducto] = useState({ nombre: '', precio: '', stock: '', categoria: '', activo: true });
  const [showEditModal, setShowEditModal] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

  useEffect(() => {
    api.get('/productos').then(res => {
      setProductos(res.data);
      // Extraer categorías únicas del atributo categoria
      const cats = Array.from(new Set(res.data.map(p => p.categoria).filter(Boolean)));
      setCategorias(['Todos', ...cats]);
    });
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
    setNuevoProducto({ nombre: '', precio: '', stock: '', categoria: '' });
  };

  const handleGuardarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      setNotificacion({ mensaje: 'Nombre, precio y stock son obligatorios.', tipo: 'error' });
      return;
    }
    try {
      await api.post('/productos', nuevoProducto);
      setNotificacion({ mensaje: 'Producto creado correctamente.', tipo: 'success' });
      // Refrescar lista de productos y categorías
      api.get('/productos').then(res => {
        setProductos(res.data);
        const cats = Array.from(new Set(res.data.map(p => p.categoria).filter(Boolean)));
        setCategorias(['Todos', ...cats]);
      });
      handleCloseModal();
    } catch (err) {
      setNotificacion({ mensaje: 'Error al crear producto.', tipo: 'error' });
    }
  };

  const handleEditarProducto = (producto) => {
    setEditando(producto.id_producto);
    setEditProducto({
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      categoria: producto.categoria || '',
      activo: !!producto.activo
    });
    setShowEditModal(true);
  };

  const handleGuardarEdicion = async () => {
    if (!editProducto.nombre || !editProducto.precio || !editProducto.stock) {
      setNotificacion({ mensaje: 'Nombre, precio y stock son obligatorios.', tipo: 'error' });
      return;
    }
    try {
      await api.put(`/productos/${editando}`, editProducto);
      setNotificacion({ mensaje: 'Producto actualizado correctamente.', tipo: 'success' });
      // Refrescar lista de productos
      api.get('/productos').then(res => {
        setProductos(res.data);
        const cats = Array.from(new Set(res.data.map(p => p.categoria).filter(Boolean)));
        setCategorias(['Todos', ...cats]);
      });
      setEditando(null);
      setShowEditModal(false);
    } catch (err) {
      setNotificacion({ mensaje: 'Error al actualizar producto.', tipo: 'error' });
    }
  };

  const handleDeshabilitarProducto = async (id_producto) => {
    try {
      await api.delete(`/productos/${id_producto}`);
      setNotificacion({ mensaje: 'Producto deshabilitado correctamente.', tipo: 'success' });
      api.get('/productos').then(res => {
        setProductos(res.data);
        const cats = Array.from(new Set(res.data.map(p => p.categoria).filter(Boolean)));
        setCategorias(['Todos', ...cats]);
      });
    } catch (err) {
      setNotificacion({ mensaje: 'Error al deshabilitar producto.', tipo: 'error' });
    }
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
    setShowEditModal(false);
  };

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaSeleccionada === '' || categoriaSeleccionada === 'Todos' || (p.categoria && p.categoria === categoriaSeleccionada);
    return matchBusqueda && matchCategoria;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', marginLeft: '240px', padding: '40px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontWeight: 'bold', fontSize: '2rem', color: '#222', margin: 0 }}>Productos</h1>
            <button type='button' onClick={handleOpenModal} style={{ background: '#1abc5b', color: '#fff', fontWeight: 'bold', fontSize: '1rem', padding: '10px 24px', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(26,188,91,0.07)' }}>
              + Agregar Producto
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
            <input type='text' placeholder='Buscar productos...' value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
            <select value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)} style={{ minWidth: '180px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>NOMBRE</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>PRECIO</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>STOCK</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>CATEGORÍA</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>ESTADO</th>
                <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: '#888' }}>No hay productos</td></tr>
              ) : (
                productosFiltrados.map(p => (
                  <tr key={p.id_producto}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#222' }}>{p.nombre}</td>
                    <td style={{ padding: '10px', color: '#222' }}>S/. {Number(p.precio).toFixed(2)}</td>
                    <td style={{ padding: '10px', color: '#222' }}>{p.stock}</td>
                    <td style={{ padding: '10px', color: '#222' }}>{p.categoria || '-'}</td>
                    <td style={{ padding: '10px', color: p.activo ? '#1abc5b' : '#e53935', fontWeight: 'bold' }}>{p.activo ? 'Activo' : 'Inactivo'}</td>
                    <td style={{ padding: '10px', color: '#222' }}>
                      <span style={{ color: '#2196f3', cursor: 'pointer', marginRight: '12px', fontWeight: 'bold' }} onClick={() => handleEditarProducto(p)}>✎ Editar</span>
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
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Agregar Producto</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Nombre</label>
              <input type='text' placeholder='Nombre' value={nuevoProducto.nombre} onChange={e => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Categoría</label>
              <select value={nuevoProducto.categoria} onChange={e => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}>
                <option value=''>Seleccionar categoría</option>
                {categorias.filter(cat => cat !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Precio unitario</label>
              <input type='number' placeholder='S/.' value={nuevoProducto.precio} onChange={e => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Stock</label>
              <input type='number' placeholder='Stock' value={nuevoProducto.stock} onChange={e => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button type='button' onClick={handleCloseModal} style={{ background: '#f5f5f5', color: '#222', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancelar</button>
              <button type='button' onClick={handleGuardarProducto} style={{ background: '#1abc5b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '400px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={handleCancelarEdicion} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#888', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Editar Producto</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Nombre</label>
              <input type='text' placeholder='Nombre' value={editProducto.nombre} onChange={e => setEditProducto({ ...editProducto, nombre: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Categoría</label>
              <select value={editProducto.categoria} onChange={e => setEditProducto({ ...editProducto, categoria: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}>
                <option value=''>Seleccionar categoría</option>
                {categorias.filter(cat => cat !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Precio unitario</label>
              <input type='number' placeholder='S/.' value={editProducto.precio} onChange={e => setEditProducto({ ...editProducto, precio: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#222' }}>Stock</label>
              <input type='number' placeholder='Stock' value={editProducto.stock} onChange={e => setEditProducto({ ...editProducto, stock: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#222' }}>
                Estado:
                <label style={{ marginLeft: '16px', marginRight: '12px' }}>
                  <input type='radio' name='estado' checked={editProducto.activo === true} onChange={() => setEditProducto({ ...editProducto, activo: true })} /> Activo
                </label>
                <label>
                  <input type='radio' name='estado' checked={editProducto.activo === false} onChange={() => setEditProducto({ ...editProducto, activo: false })} /> Inactivo
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

export default Productos;

