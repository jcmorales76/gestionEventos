const mysql = require("mysql2/promise"); // ← IMPORTANTE: /promise

// Crear pool de conexiones con promesas (credenciales desde variables de entorno)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eventflow_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión exitosa a la base de datos EventFlow");
    connection.release();
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error.message);
  }
}

testConnection();

module.exports = pool;
