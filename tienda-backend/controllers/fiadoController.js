const { pool } = require('../models/db');
const db = pool.promise();

exports.marcarPagado = async (req, res) => {
  const { id_venta } = req.body || {};
  if (!id_venta) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  try {
    const [result] = await db.query(
      "UPDATE fiado SET estado_pago = 'pagado', fecha_cancelacion = NOW() WHERE id_venta = ?",
      [id_venta]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fiado no encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating fiado:', error);
    res.status(500).json({ error: 'Error al actualizar fiado' });
  }
};

exports.listarFiados = async (_req, res) => {
  const query = `
    SELECT f.id_venta,
           v.fecha AS fecha_fiado,
           CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
           v.total AS monto,
           f.estado_pago,
           f.fecha_limite_pago,
           DATE_FORMAT(f.fecha_cancelacion, '%Y-%m-%d %H:%i:%s') AS fecha_cancelacion
      FROM fiado f
      JOIN venta v ON f.id_venta = v.id_venta
      JOIN cliente c ON v.id_cliente = c.id_cliente
      ORDER BY v.fecha DESC`;
  try {
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching fiados:', error);
    res.status(500).json({ error: 'Error al obtener fiados' });
  }
};
