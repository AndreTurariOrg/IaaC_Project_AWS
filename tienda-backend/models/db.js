const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'tiendauser',
  password: process.env.DB_PASSWORD || 'tiendapass',
  database: process.env.DB_NAME || 'tienda',
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 10,
  queueLimit: 0,
  multipleStatements: false
};

// Create a connection pool so the app can scale safely
const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  connection.release();
});

module.exports = {
  pool,
  dbConfig
};
