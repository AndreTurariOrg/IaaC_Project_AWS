require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const { dbConfig } = require('./models/db');
const usuarioRoutes = require('./routes/usuarioRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const fiadoRoutes = require('./routes/fiadoRoutes');
const { requireAuth } = require('./middleware/auth');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, origin || allowedOrigins[0] || true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const sessionStore = new MySQLStore({
  ...dbConfig,
  createDatabaseTable: true
});

const maxAgeHours = Number(process.env.SESSION_TTL_HOURS || 24);

app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia_este_valor',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: process.env.SESSION_COOKIE_SAMESITE || 'lax',
    maxAge: maxAgeHours * 60 * 60 * 1000
  }
}));

app.use('/api', usuarioRoutes);
app.use('/api', ventaRoutes);
app.use('/api', productoRoutes);
app.use('/api', clienteRoutes);
app.use('/api', reporteRoutes);
app.use('/api', fiadoRoutes);

app.post('/api/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar sesion' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
