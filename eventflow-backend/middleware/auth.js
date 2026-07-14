const jwt = require("jsonwebtoken");

// Secreto del JWT: idealmente desde variable de entorno.
const SECRET = process.env.JWT_SECRET || "tu_secreto_super_seguro_123";

// Verifica el token JWT (header Authorization: Bearer <token>)
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Sesión inválida o expirada" });
  }
}

// Exige que el usuario tenga uno de los roles indicados
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    next();
  };
}

module.exports = { auth, requireRole, SECRET };
