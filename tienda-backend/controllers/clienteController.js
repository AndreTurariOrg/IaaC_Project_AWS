const { pool } = require('../models/db');
const db = pool.promise();

exports.getClientes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_cliente, nombre, apellidos, direccion, telefono, activo FROM cliente WHERE activo = 1');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching active clients:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

exports.getTodosClientes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_cliente, nombre, apellidos, direccion, telefono, activo FROM cliente');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

exports.crearCliente = async (req, res) => {
  const { nombre, apellidos, direccion, telefono } = req.body || {};
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'Nombre y apellidos son obligatorios' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO cliente (nombre, apellidos, direccion, telefono, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellidos, direccion || '', telefono || '', true]
    );
    res.json({ id_cliente: result.insertId });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Error al crear cliente', detalle: error.message });
  }
};

exports.editarCliente = async (req, res) => {
  const { id_cliente } = req.params;
  const { nombre, apellidos, direccion, telefono, activo } = req.body || {};
  if (!id_cliente) {
    return res.status(400).json({ error: 'ID de cliente requerido' });
  }
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'Nombre y apellidos son obligatorios' });
  }
  const activoValue = (activo === true || activo === 'true' || activo === 1 || activo === '1') ? 1 : 0;
  try {
    await db.query(
      'UPDATE cliente SET nombre = ?, apellidos = ?, direccion = ?, telefono = ?, activo = ? WHERE id_cliente = ?',
      [nombre, apellidos, direccion || '', telefono || '', activoValue, id_cliente]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Error al editar cliente', detalle: error.message });
  }
};

exports.deshabilitarCliente = async (req, res) => {
  const { id_cliente } = req.params;
  if (!id_cliente) {
    return res.status(400).json({ error: 'ID de cliente requerido' });
  }
  try {
    await db.query('UPDATE cliente SET activo = FALSE WHERE id_cliente = ?', [id_cliente]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling client:', error);
    res.status(500).json({ error: 'Error al deshabilitar cliente', detalle: error.message });
  }
};
