const mysql = require('mysql2');

// Pool de conexiones en vez de una única conexión: si la conexión se cae
// (timeout, reinicio de MySQL, etc.) el pool reconecta sola en la próxima
// consulta, en lugar de dejar el servidor sin poder hablarle nunca más a la DB.
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stepping_stones_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
    return;
  }
  console.log(`¡Conectado exitosamente a la base de datos ${process.env.DB_NAME || 'stepping_stones_db'}!`);
  connection.release();
});

module.exports = db;
