const { pool } = require('../models/db');
const db = pool.promise();

exports.crearProducto = async (req, res) => {
  const { nombre, categoria, precio, stock, activo } = req.body || {};
  if (!nombre || precio === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
  }
  const activoValue = (activo === false || activo === 0 || activo === '0' || activo === 'false') ? 0 : 1;
  try {
    const [result] = await db.query(
      'INSERT INTO producto (nombre, categoria, precio, stock, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, categoria || '', Number(precio), Number(stock), activoValue]
    );
    res.json({ id_producto: result.insertId });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear producto', detalle: error.message });
  }
};

exports.editarProducto = async (req, res) => {
  const { id_producto } = req.params;
  const { nombre, categoria, precio, stock, activo } = req.body || {};
  if (!id_producto) {
    return res.status(400).json({ error: 'ID de producto requerido' });
  }
  if (!nombre || precio === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
  }
  const activoValue = (activo === false || activo === 0 || activo === '0' || activo === 'false') ? 0 : 1;
  try {
    await db.query(
      'UPDATE producto SET nombre = ?, categoria = ?, precio = ?, stock = ?, activo = ? WHERE id_producto = ?',
      [nombre, categoria || '', Number(precio), Number(stock), activoValue, id_producto]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error al editar producto', detalle: error.message });
  }
};

exports.getProductos = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id_producto, nombre, categoria, precio, stock, activo FROM producto');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

exports.deshabilitarProducto = async (req, res) => {
  const { id_producto } = req.params;
  if (!id_producto) {
    return res.status(400).json({ error: 'ID de producto requerido' });
  }
  try {
    await db.query('UPDATE producto SET activo = FALSE WHERE id_producto = ?', [id_producto]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling product:', error);
    res.status(500).json({ error: 'Error al deshabilitar producto', detalle: error.message });
  }
};
