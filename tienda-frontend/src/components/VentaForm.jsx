import React, { useState } from 'react';
import api from '../services/api';

const VentaForm = () => {
  const [clienteId, setClienteId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      await api.post('/venta', {
        id_cliente: Number(clienteId),
        productos: [{ id_producto: Number(productoId), cantidad: Number(cantidad) }],
        medio_compra: 'presencial',
        tipo_pago: 'efectivo',
        forma_pago: 'completo'
      });
      setMensaje('Venta registrada');
    } catch (error) {
      const detail = error.response?.data?.error || 'Hubo un error al registrar la venta';
      setMensaje(detail);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type='number' placeholder='ID Cliente' value={clienteId} onChange={(e) => setClienteId(e.target.value)} required />
      <input type='number' placeholder='ID Producto' value={productoId} onChange={(e) => setProductoId(e.target.value)} required />
      <input type='number' placeholder='Cantidad' value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
      <button type='submit'>Registrar Venta</button>
      {mensaje && <div>{mensaje}</div>}
    </form>
  );
};

export default VentaForm;
