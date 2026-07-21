const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { hashPassword } = require("../utils/security");
const { registrarAuditoria } = require("../utils/auditoria");

// ===== Subida de foto de perfil (avatar) =====
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/avatars");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `avatar_${req.params.id}_${Date.now()}${ext}`);
  },
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, /jpeg|jpg|png|gif|webp/.test(file.mimetype)),
});
exports.uploadAvatar = uploadAvatar;

// Guardar la foto de perfil de un usuario
exports.uploadFoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ninguna imagen" });
    }
    const { id } = req.params;
    const fotoUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query("UPDATE usuarios SET foto_url = ? WHERE id = ?", [
      fotoUrl,
      id,
    ]);
    await registrarAuditoria(req, {
      accion: "subir",
      modulo: "usuarios",
      entidad_id: Number(id) || null,
      descripcion: `Subió foto de perfil del usuario ${id}`,
    });
    res.json({ message: "Foto actualizada", foto_url: fotoUrl });
  } catch (error) {
    console.error("Error al subir foto:", error);
    res.status(500).json({ message: "Error al subir la foto" });
  }
};

// Obtener todos los usuarios (admins y participantes)
exports.getUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      "SELECT id, nombre, apellido, email, rol, dni, telefono, estado, empresa, foto_url, intentos_fallidos, bloqueado_hasta, password_changed_at, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC",
    );
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// Crear nuevo usuario
exports.createUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, dni, telefono, estado, empresa } =
      req.body;

    if (!nombre || !apellido || !email || !dni || !telefono) {
      return res.status(400).json({
        message: "Faltan campos obligatorios (nombre, apellido, correo, DNI y teléfono)",
      });
    }

    const hash = await hashPassword(password || "123456");
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, apellido, email, password, rol, dni, telefono, estado, empresa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre,
        apellido,
        email,
        hash,
        rol || "admin",
        dni,
        telefono,
        estado || "Activo",
        empresa || null,
      ],
    );

    await registrarAuditoria(req, {
      accion: "crear",
      modulo: "usuarios",
      entidad_id: result.insertId,
      descripcion: `Creó el usuario ${nombre} ${apellido} (${email}, ${rol || "admin"})`,
    });

    res
      .status(201)
      .json({ id: result.insertId, message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

// Actualizar usuario
exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, dni, telefono, estado, empresa } =
      req.body;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({
        message: "Nombre, apellido y correo son obligatorios",
      });
    }

    await pool.query(
      "UPDATE usuarios SET nombre=?, apellido=?, email=?, rol=?, dni=?, telefono=?, estado=?, empresa=? WHERE id=?",
      [nombre, apellido, email, rol, dni, telefono, estado, empresa || null, id],
    );

    await registrarAuditoria(req, {
      accion: "editar",
      modulo: "usuarios",
      entidad_id: Number(id) || null,
      descripcion: `Editó el usuario ${nombre} ${apellido} (${email})`,
    });

    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// Eliminar usuario
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const [[u]] = await pool.query(
      "SELECT nombre, apellido, email FROM usuarios WHERE id=?",
      [id],
    );
    await pool.query("DELETE FROM usuarios WHERE id=?", [id]);
    await registrarAuditoria(req, {
      accion: "eliminar",
      modulo: "usuarios",
      entidad_id: Number(id) || null,
      descripcion: u
        ? `Eliminó el usuario ${u.nombre} ${u.apellido} (${u.email})`
        : `Eliminó el usuario ${id}`,
    });
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

// Desbloquear una cuenta (admin)
exports.desbloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [id],
    );
    await registrarAuditoria(req, {
      accion: "desbloquear",
      modulo: "usuarios",
      entidad_id: Number(id) || null,
      descripcion: `Desbloqueó la cuenta del usuario ${id}`,
    });
    res.json({ message: "Cuenta desbloqueada" });
  } catch (error) {
    console.error("Error al desbloquear usuario:", error);
    res.status(500).json({ message: "Error al desbloquear la cuenta" });
  }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hash = await hashPassword(newPassword || "123456");
    await pool.query(
      "UPDATE usuarios SET password = ?, password_changed_at = NOW() WHERE id = ?",
      [hash, id],
    );

    await registrarAuditoria(req, {
      accion: "reset_password",
      modulo: "usuarios",
      entidad_id: Number(id) || null,
      descripcion: `Reseteó la contraseña del usuario ${id}`,
    });

    res.json({ message: "Contraseña reseteada exitosamente" });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    res.status(500).json({ message: "Error al resetear contraseña" });
  }
};
