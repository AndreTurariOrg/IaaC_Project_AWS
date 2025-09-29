import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const initialCliente = { nombre: '', apellidos: '', direccion: '', telefono: '' };

const Ventas = () => {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [medioCompra, setMedioCompra] = useState('presencial');
  const [tipoCobro, setTipoCobro] = useState('efectivo');
  const [formaPago, setFormaPago] = useState('completo');
  const [fechaLimiteFiado, setFechaLimiteFiado] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [notificacion, setNotificacion] = useState(null);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(initialCliente);
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productosRes, clientesRes] = await Promise.all([
          api.get('/productos'),
          api.get('/clientes')
        ]);
        setProductos(productosRes.data || []);
        setClientes(clientesRes.data || []);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        setProductos([]);
        setClientes([]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timeout = setTimeout(() => setNotificacion(null), 3000);
    return () => clearTimeout(timeout);
  }, [notificacion]);

  const subtotal = useMemo(
    () => carrito.reduce((acc, item) => acc + item.subtotal, 0),
    [carrito]
  );
  const igv = useMemo(() => +(subtotal * 0.18).toFixed(2), [subtotal]);
  const total = useMemo(() => +(subtotal + igv).toFixed(2), [subtotal, igv]);
  const vuelto = useMemo(() => {
    const pagado = Number(montoPagado || 0);
    return pagado > total ? +(pagado - total).toFixed(2) : 0;
  }, [montoPagado, total]);

  const mostrarMensaje = (mensaje, tipo = 'info') => {
    setNotificacion({ mensaje, tipo });
  };

  const handleAddToCart = () => {
    const producto = productos.find((p) => String(p.id_producto) === String(productoSeleccionado));
    if (!producto) {
      mostrarMensaje('Selecciona un producto valido.', 'error');
      return;
    }
    if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
      mostrarMensaje('La cantidad debe ser mayor a cero.', 'error');
      return;
    }
    if (Number(cantidad) > Number(producto.stock)) {
      mostrarMensaje(`Stock insuficiente. Solo hay ${producto.stock} unidades.`, 'error');
      return;
    }
    const item = {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: Number(cantidad),
      subtotal: Number((Number(producto.precio) * Number(cantidad)).toFixed(2))
    };
    setCarrito((prev) => [...prev, item]);
    mostrarMensaje('Producto agregado al carrito.', 'success');
    setProductoSeleccionado('');
    setCantidad(1);
  };

  const handleRemoveFromCart = (index) => {
    setCarrito((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleNuevaVenta = () => {
    setCarrito([]);
    setProductoSeleccionado('');
    setCantidad(1);
    setMedioCompra('presencial');
    setTipoCobro('efectivo');
    setFormaPago('completo');
    setFechaLimiteFiado('');
    setClienteSeleccionado('');
    setMontoPagado('');
  };

  const handleRegistrarVenta = async () => {
    if (!clienteSeleccionado) {
      mostrarMensaje('Selecciona un cliente.', 'error');
      return;
    }
    if (carrito.length === 0) {
      mostrarMensaje('Agrega productos al carrito.', 'error');
      return;
    }
    if (formaPago === 'fiado' && !fechaLimiteFiado) {
      mostrarMensaje('Selecciona la fecha limite de pago para fiado.', 'error');
      return;
    }

    const payload = {
      id_cliente: Number(clienteSeleccionado),
      medio_compra: medioCompra,
      tipo_pago: tipoCobro,
      forma_pago: formaPago,
      productos: carrito.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad
      }))
    };

    if (formaPago === 'fiado') {
      payload.fiado = { fecha_limite_pago: fechaLimiteFiado };
    }

    try {
      const response = await api.post('/venta', payload);
      if (response.data?.success) {
        mostrarMensaje('Venta registrada con exito.', 'success');
        handleNuevaVenta();
        const productosActualizados = await api.get('/productos');
        setProductos(productosActualizados.data || []);
      } else {
        mostrarMensaje('No se pudo registrar la venta.', 'error');
      }
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al registrar la venta.';
      mostrarMensaje(mensaje, 'error');
    }
  };

  const handleGuardarCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.apellidos) {
      mostrarMensaje('Nombre y apellidos son obligatorios.', 'error');
      return;
    }
    setGuardandoCliente(true);
    try {
      const res = await api.post('/clientes', nuevoCliente);
      if (res.data?.id_cliente) {
        const lista = await api.get('/clientes');
        setClientes(lista.data || []);
        setClienteSeleccionado(String(res.data.id_cliente));
        setMostrarModalCliente(false);
        setNuevoCliente(initialCliente);
        mostrarMensaje('Cliente creado con exito.', 'success');
      }
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al registrar cliente.';
      mostrarMensaje(mensaje, 'error');
    } finally {
      setGuardandoCliente(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', marginLeft: '240px', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '32px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Nueva venta</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <div>
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Producto</label>
                  <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value=''>Seleccionar producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id_producto} value={producto.id_producto}>
                        {producto.nombre} (Stock {producto.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Cantidad</label>
                  <input type='number' min='1' value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} style={{ width: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <button type='button' onClick={handleAddToCart} disabled={!productoSeleccionado} style={{ height: '44px', padding: '0 24px', background: productoSeleccionado ? '#2196f3' : '#b0b8c1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: productoSeleccionado ? 'pointer' : 'not-allowed' }}>
                  Agregar
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#888' }}>Producto</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#888' }}>Cantidad</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#888' }}>Precio</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#888' }}>Subtotal</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: '#888' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '18px', color: '#888' }}>No hay productos en el carrito</td>
                    </tr>
                  ) : (
                    carrito.map((item, index) => (
                      <tr key={`${item.id_producto}-${index}`}>
                        <td style={{ padding: '10px' }}>{item.nombre}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{item.cantidad}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>S/ {item.precio.toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>S/ {item.subtotal.toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button type='button' onClick={() => handleRemoveFromCart(index)} style={{ background: 'none', border: 'none', color: '#e53935', fontWeight: 'bold', cursor: 'pointer' }}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Detalle del pago</h2>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Medio de compra</div>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='medioCompra' value='presencial' checked={medioCompra === 'presencial'} onChange={(e) => setMedioCompra(e.target.value)} /> presencial
                </label>
                <label>
                  <input type='radio' name='medioCompra' value='whatsapp' checked={medioCompra === 'whatsapp'} onChange={(e) => setMedioCompra(e.target.value)} /> WhatsApp
                </label>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Metodo de cobro</div>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='tipoCobro' value='efectivo' checked={tipoCobro === 'efectivo'} onChange={(e) => setTipoCobro(e.target.value)} disabled={formaPago === 'fiado'} /> efectivo
                </label>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='tipoCobro' value='yape' checked={tipoCobro === 'yape'} onChange={(e) => setTipoCobro(e.target.value)} disabled={formaPago === 'fiado'} /> Yape
                </label>
                <label>
                  <input type='radio' name='tipoCobro' value='plin' checked={tipoCobro === 'plin'} onChange={(e) => setTipoCobro(e.target.value)} disabled={formaPago === 'fiado'} /> Plin
                </label>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Forma de pago</div>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='formaPago' value='completo' checked={formaPago === 'completo'} onChange={(e) => setFormaPago(e.target.value)} /> completo
                </label>
                <label>
                  <input type='radio' name='formaPago' value='fiado' checked={formaPago === 'fiado'} onChange={(e) => setFormaPago(e.target.value)} /> fiado
                </label>
              </div>
              {formaPago === 'fiado' && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Fecha limite de pago</div>
                  <input type='date' value={fechaLimiteFiado} onChange={(e) => setFechaLimiteFiado(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
              )}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Cliente</div>
                <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}>
                  <option value=''>Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {`${cliente.nombre} ${cliente.apellidos}`}
                    </option>
                  ))}
                </select>
                <button type='button' onClick={() => setMostrarModalCliente(true)} style={{ marginTop: '10px', color: '#2196f3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Agregar cliente
                </button>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Monto pagado</div>
                  <input type='number' min='0' value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Vuelto</div>
                  <input type='text' readOnly value={`S/ ${vuelto.toFixed(2)}`} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5' }} />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Subtotal</span>
                  <strong>S/ {subtotal.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>IGV (18%)</span>
                  <strong>S/ {igv.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <span>Total</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>
              <button type='button' onClick={handleRegistrarVenta} style={{ width: '100%', background: '#1abc5b', color: '#fff', padding: '14px', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '18px' }}>
                Registrar venta
              </button>
            </div>
          </div>
        </div>
      </div>

      {mostrarModalCliente && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '400px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setMostrarModalCliente(false)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#888', cursor: 'pointer' }}>X</button>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Agregar cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type='text' placeholder='Nombre' value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <input type='text' placeholder='Apellidos' value={nuevoCliente.apellidos} onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <input type='text' placeholder='Direccion (opcional)' value={nuevoCliente.direccion} onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <input type='text' placeholder='Telefono (opcional)' value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type='button' onClick={() => setMostrarModalCliente(false)} style={{ background: '#f5f5f5', color: '#222', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancelar</button>
              <button type='button' onClick={handleGuardarCliente} disabled={guardandoCliente} style={{ background: '#1abc5b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: guardandoCliente ? 'not-allowed' : 'pointer' }}>
                {guardandoCliente ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notificacion && (
        <div style={{ position: 'fixed', left: '32px', bottom: '32px', zIndex: 1100, minWidth: '260px', padding: '16px 24px', borderRadius: '8px', background: notificacion.tipo === 'error' ? '#ffeaea' : notificacion.tipo === 'success' ? '#eaffea' : '#eef2ff', color: notificacion.tipo === 'error' ? '#e53935' : notificacion.tipo === 'success' ? '#1abc5b' : '#4c51bf', fontWeight: 'bold', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '1rem' }}>
          {notificacion.mensaje}
        </div>
      )}
    </div>
  );
};

export default Ventas;
