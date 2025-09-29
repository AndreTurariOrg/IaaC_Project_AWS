const bcrypt = require('bcrypt');
const { pool } = require('../models/db');
const db = pool.promise();

exports.verificarSesion = (req, res) => {
  if (req.session && req.session.usuario) {
    res.json({ autenticado: true, usuario: req.session.usuario });
  } else {
    res.json({ autenticado: false });
  }
};

exports.login = async (req, res) => {
  const { nombre, contrasena } = req.body || {};
  if (!nombre || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM usuario WHERE nombre = ?', [nombre]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario o contrasena incorrectos' });
    }
    const usuario = rows[0];
    const storedPassword = usuario.contrasena || '';

    let passwordOk = false;
    if (storedPassword.startsWith('$2')) {
      passwordOk = await bcrypt.compare(contrasena, storedPassword);
    } else if (storedPassword.length > 0 && storedPassword === contrasena) {
      passwordOk = true;
      try {
        const newHash = await bcrypt.hash(contrasena, 10);
        await db.query('UPDATE usuario SET contrasena = ? WHERE id_usuario = ?', [newHash, usuario.id_usuario]);
      } catch (rehashError) {
        console.warn('No se pudo actualizar la contrasena a hash para el usuario', usuario.id_usuario, rehashError.message);
      }
    }

    if (!passwordOk) {
      return res.status(401).json({ mensaje: 'Usuario o contrasena incorrectos' });
    }

    req.session.usuario = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre
    };
    res.json({ mensaje: 'Login exitoso', usuario: req.session.usuario });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};
