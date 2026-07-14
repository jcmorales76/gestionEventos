const pool = require("../config/db");

// Asegura (idempotente) que existan las tablas/columnas nuevas.
// Se ejecuta al arrancar, así el despliegue no requiere SQL manual.
async function migrarEsquema() {
  try {
    // Columna usuarios.empresa
    const [col] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'empresa'");
    if (col.length === 0) {
      await pool.query("ALTER TABLE usuarios ADD COLUMN empresa VARCHAR(200) NULL");
      console.log("🧩 Columna usuarios.empresa creada");
    }

    // Bloqueo por intentos fallidos
    const [c1] = await pool.query(
      "SHOW COLUMNS FROM usuarios LIKE 'intentos_fallidos'",
    );
    if (c1.length === 0) {
      await pool.query(
        "ALTER TABLE usuarios ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0",
      );
    }
    const [c2] = await pool.query(
      "SHOW COLUMNS FROM usuarios LIKE 'bloqueado_hasta'",
    );
    if (c2.length === 0) {
      await pool.query(
        "ALTER TABLE usuarios ADD COLUMN bloqueado_hasta DATETIME NULL",
      );
    }
    await pool.query(
      "INSERT IGNORE INTO configuraciones (clave, valor, descripcion) VALUES ('minutos_bloqueo','30','Minutos de bloqueo tras superar los intentos fallidos')",
    );

    // Tabla tipos_evento (+ semilla)
    await pool.query(`CREATE TABLE IF NOT EXISTS tipos_evento (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const [count] = await pool.query("SELECT COUNT(*) AS n FROM tipos_evento");
    if (count[0].n === 0) {
      const base = [
        "Curso",
        "Seminario",
        "Taller",
        "Charla",
        "Congreso",
        "Programa de Alta Dirección",
      ];
      const [ex] = await pool.query(
        "SELECT DISTINCT tipo FROM eventos WHERE tipo IS NOT NULL AND tipo <> ''",
      );
      const todos = [...new Set([...base, ...ex.map((r) => r.tipo)])];
      for (const t of todos) {
        await pool.query("INSERT IGNORE INTO tipos_evento (nombre) VALUES (?)", [
          t,
        ]);
      }
      console.log("🧩 Tabla tipos_evento creada y sembrada");
    }
  } catch (e) {
    console.error("Error migrando esquema:", e.message);
  }
}

module.exports = { migrarEsquema };
