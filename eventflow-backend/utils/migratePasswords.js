const pool = require("../config/db");
const { hashPassword, esHash } = require("./security");

// Cifra (una sola vez, idempotente) las contraseñas que aún estén en texto plano.
async function migrarPasswordsPlanas() {
  try {
    const [rows] = await pool.query("SELECT id, password FROM usuarios");
    let migrados = 0;
    for (const u of rows) {
      if (!esHash(u.password)) {
        const hash = await hashPassword(u.password || "123456");
        await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [
          hash,
          u.id,
        ]);
        migrados++;
      }
    }
    if (migrados > 0) {
      console.log(`🔐 Contraseñas cifradas (bcrypt): ${migrados}`);
    }
  } catch (e) {
    console.error("Error migrando contraseñas:", e.message);
  }
}

module.exports = { migrarPasswordsPlanas };
