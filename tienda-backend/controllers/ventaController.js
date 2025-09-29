const moment = require('moment-timezone');
const { pool } = require('../models/db');
const db = pool.promise();

const allowedMediosCompra = new Set(['presencial', 'whatsapp', 'online']);
const allowedTiposPago = new Set(['efectivo', 'yape', 'plin', 'transferencia']);
const allowedFormasPago = new Set(['completo', 'fiado']);

exports.detalleVenta = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID de venta requerido' });
  }
  try {
    const [[venta]] = await db.query(
      `SELECT v.id_venta,
              v.fecha,
              v.total,
              v.medio_compra,
              v.tipo_pago,
              v.forma_pago,
              c.nombre AS cliente_nombre,
              c.apellidos AS cliente_apellidos
         FROM venta v
         JOIN cliente c ON v.id_cliente = c.id_cliente
        WHERE v.id_venta = ?`,
      [id]
    );
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    const [productos] = await db.query(
      `SELECT p.nombre AS producto,
              dv.cantidad,
              dv.precio_cobrado,
              dv.subtotal
         FROM detalleVenta dv
         JOIN producto p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = ?`,
      [id]
    );

    const subtotal = productos.reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
    const igv = +(subtotal * 0.18).toFixed(2);

    res.json({
      id_venta: venta.id_venta,
      cliente: `${venta.cliente_nombre} ${venta.cliente_apellidos}`.trim(),
      fecha: venta.fecha,
      medio_compra: venta.medio_compra,
      tipo_pago: venta.tipo_pago,
      forma_pago: venta.forma_pago,
      productos,
      subtotal,
      igv,
      total: Number(venta.total)
    });
  } catch (error) {
    console.error('Error fetching venta detail:', error);
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
};

exports.registrarVenta = async (req, res) => {
  const { id_cliente, medio_compra, tipo_pago, forma_pago, productos, fiado } = req.body || {};
  const id_usuario = req.session?.usuario?.id_usuario;

  if (!id_usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!id_cliente) {
    return res.status(400).json({ error: 'Cliente requerido' });
  }
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un producto' });
  }

  const medioNormalizado = (medio_compra || '').toLowerCase();
  const tipoPagoNormalizado = (tipo_pago || '').toLowerCase();
  const formaPagoNormalizada = (forma_pago || '').toLowerCase();

  if (!allowedMediosCompra.has(medioNormalizado)) {
    return res.status(400).json({ error: 'Medio de compra no valido' });
  }
  if (!allowedTiposPago.has(tipoPagoNormalizado)) {
    return res.status(400).json({ error: 'Tipo de pago no valido' });
  }
  if (!allowedFormasPago.has(formaPagoNormalizada)) {
    return res.status(400).json({ error: 'Forma de pago no valida' });
  }
  if (formaPagoNormalizada === 'fiado') {
    const limite = fiado?.fecha_limite_pago;
    if (!limite) {
      return res.status(400).json({ error: 'Fecha limite de pago requerida para fiado' });
    }
    if (Number.isNaN(Date.parse(limite))) {
      return res.status(400).json({ error: 'Fecha limite de pago invalida' });
    }
  }

  const productosNormalizados = productos.map((item) => ({
    id_producto: Number(item.id_producto),
    cantidad: Number(item.cantidad)
  }));

  if (productosNormalizados.some((p) => !Number.isInteger(p.id_producto) || p.id_producto <= 0 || p.cantidad <= 0)) {
    return res.status(400).json({ error: 'Productos invalidos' });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const productIds = productosNormalizados.map((p) => p.id_producto);
    const [rows] = await connection.query(
      `SELECT id_producto, precio, stock
         FROM producto
        WHERE id_producto IN (?)
        FOR UPDATE`,
      [productIds]
    );

    if (rows.length !== productIds.length) {
      throw new Error('Uno o mas productos no existen');
    }

    const productMap = new Map(rows.map((row) => [row.id_producto, row]));

    const detalles = productosNormalizados.map((item) => {
      const data = productMap.get(item.id_producto);
      if (!data) {
        throw new Error('Producto no encontrado');
      }
      if (data.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto ${item.id_producto}`);
      }
      const precio = Number(data.precio);
      const subtotal = +(precio * item.cantidad).toFixed(2);
      return {
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio,
        subtotal
      };
    });

    const subtotal = detalles.reduce((acc, d) => acc + d.subtotal, 0);
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);

    const fecha = moment().tz(process.env.APP_TIMEZONE || 'America/Lima').format('YYYY-MM-DD HH:mm:ss');

    const [ventaResult] = await connection.query(
      'INSERT INTO venta (id_cliente, id_usuario, fecha, total, medio_compra, tipo_pago, forma_pago) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_cliente, id_usuario, fecha, total, medioNormalizado, tipoPagoNormalizado, formaPagoNormalizada]
    );
    const id_venta = ventaResult.insertId;

    for (const detalle of detalles) {
      await connection.query(
        'INSERT INTO detalleVenta (id_venta, id_producto, cantidad, precio_cobrado, subtotal) VALUES (?, ?, ?, ?, ?)',
        [id_venta, detalle.id_producto, detalle.cantidad, detalle.precio, detalle.subtotal]
      );
      await connection.query(
        'UPDATE producto SET stock = stock - ? WHERE id_producto = ?',
        [detalle.cantidad, detalle.id_producto]
      );
    }

    if (formaPagoNormalizada === 'fiado') {
      await connection.query(
        'INSERT INTO fiado (id_venta, estado_pago, fecha_limite_pago) VALUES (?, ?, ?)',
        [id_venta, 'pendiente', fiado.fecha_limite_pago]
      );
    }

    await connection.commit();
    res.json({ success: true, id_venta, total, igv, subtotal });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failure:', rollbackError);
      }
    }
    console.error('Error registering venta:', error);
    const clientErrors = ['Stock insuficiente', 'Uno o mas productos no existen', 'Producto no encontrado', 'Productos invalidos'];
    const isClientError = clientErrors.some((msg) => error.message.includes(msg));
    res.status(isClientError ? 400 : 500).json({ error: isClientError ? error.message : 'Error al registrar la venta' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
