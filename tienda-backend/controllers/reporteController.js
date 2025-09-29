const { pool } = require('../models/db');
const db = pool.promise();

exports.listarVentas = async (_req, res) => {
  const query = `
    SELECT v.id_venta,
           v.fecha,
           v.total,
           CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
           u.nombre AS vendedor
      FROM venta v
      JOIN cliente c ON v.id_cliente = c.id_cliente
      JOIN usuario u ON v.id_usuario = u.id_usuario
      ORDER BY v.fecha DESC`;
  try {
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};
