const mysql = require("mysql2/promise"); // ← IMPORTANTE: /promise

// Crear pool de conexiones con promesas
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "eventflow_db",
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
