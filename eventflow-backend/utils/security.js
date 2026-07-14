const bcrypt = require("bcryptjs");

// ¿El valor almacenado ya es un hash bcrypt?
const esHash = (s) => typeof s === "string" && /^\$2[aby]\$/.test(s);

// Cifra una contraseña en texto plano
async function hashPassword(plain) {
  return bcrypt.hash(String(plain), 10);
}

// Verifica una contraseña contra lo almacenado.
// Soporta la transición: si lo almacenado es texto plano (legado), compara directo.
async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (esHash(stored)) return bcrypt.compare(String(plain), stored);
  return String(plain) === String(stored);
}

module.exports = { esHash, hashPassword, verifyPassword };
