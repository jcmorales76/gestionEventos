const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { eventoId, sesion } = req.body;
    const uploadPath = path.join(
      __dirname,
      `../uploads/eventos/${eventoId}/${sesion}`,
    );

    // Crear carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes =
    /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|jpg|jpeg|png|mp4|avi|mov/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = file.mimetype;

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB máximo
  fileFilter: fileFilter,
});

// Obtener materiales de un evento
exports.getMaterialesByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const [materiales] = await pool.query(
      "SELECT * FROM materiales WHERE evento_id = ? ORDER BY sesion, fecha_subida DESC",
      [eventoId],
    );

    // Agrupar por sesiones
    const materialesPorSesion = {};
    materiales.forEach((m) => {
      if (!materialesPorSesion[m.sesion]) {
        materialesPorSesion[m.sesion] = [];
      }
      materialesPorSesion[m.sesion].push(m);
    });

    res.json(materialesPorSesion);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ message: "Error al obtener materiales" });
  }
};

// Subir material
exports.uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    const { eventoId, sesion, descripcion } = req.body;

    const materialData = {
      evento_id: eventoId,
      sesion: sesion,
      nombre_original: req.file.originalname,
      nombre_archivo: req.file.filename,
      tipo_archivo: req.file.mimetype,
      tamaño: req.file.size,
      descripcion: descripcion || "",
      url_descarga: `/uploads/eventos/${eventoId}/${sesion}/${req.file.filename}`,
    };

    const [result] = await pool.query(
      "INSERT INTO materiales (evento_id, sesion, nombre_original, nombre_archivo, tipo_archivo, tamaño, descripcion, url_descarga) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        materialData.evento_id,
        materialData.sesion,
        materialData.nombre_original,
        materialData.nombre_archivo,
        materialData.tipo_archivo,
        materialData.tamaño,
        materialData.descripcion,
        materialData.url_descarga,
      ],
    );

    res.status(201).json({
      id: result.insertId,
      message: "Material subido exitosamente",
      data: materialData,
    });
  } catch (error) {
    console.error("Error al subir material:", error);
    res.status(500).json({ message: "Error al subir material" });
  }
};

// Eliminar material
exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información del material
    const [materiales] = await pool.query(
      "SELECT * FROM materiales WHERE id = ?",
      [id],
    );

    if (materiales.length === 0) {
      return res.status(404).json({ message: "Material no encontrado" });
    }

    const material = materiales[0];

    // Eliminar archivo físico
    const filePath = path.join(__dirname, "..", material.url_descarga);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar de la base de datos
    await pool.query("DELETE FROM materiales WHERE id = ?", [id]);

    res.json({ message: "Material eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ message: "Error al eliminar material" });
  }
};

// Crear sesión (solo registrar, no requiere archivo)
exports.crearSesion = async (req, res) => {
  try {
    const { eventoId, sesion } = req.body;

    // Verificar si ya existe
    const [existing] = await pool.query(
      "SELECT * FROM materiales WHERE evento_id = ? AND sesion = ? LIMIT 1",
      [eventoId, sesion],
    );

    if (existing.length === 0) {
      // Crear un registro dummy para la sesión
      await pool.query(
        "INSERT INTO materiales (evento_id, sesion, nombre_original, nombre_archivo, tipo_archivo, tamaño, descripcion, url_descarga) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [eventoId, sesion, "", "", "", 0, "", ""],
      );
    }

    res.json({ message: "Sesión creada exitosamente" });
  } catch (error) {
    console.error("Error al crear sesión:", error);
    res.status(500).json({ message: "Error al crear sesión" });
  }
};

// Obtener todas las sesiones de un evento
exports.getSesionesByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const [sesiones] = await pool.query(
      "SELECT DISTINCT sesion FROM materiales WHERE evento_id = ? ORDER BY sesion",
      [eventoId],
    );

    res.json(sesiones.map((s) => s.sesion));
  } catch (error) {
    console.error("Error al obtener sesiones:", error);
    res.status(500).json({ message: "Error al obtener sesiones" });
  }
};

module.exports = {
  upload,
  getMaterialesByEvento,
  uploadMaterial,
  deleteMaterial,
  crearSesion,
  getSesionesByEvento,
};
