const pool = require("../config/db");

// Obtener todas las configuraciones
exports.getConfiguracion = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM configuraciones");
    // Convertir array a objeto para que sea más fácil usar en el frontend
    const configObj = {};
    rows.forEach((row) => {
      configObj[row.clave] = { valor: row.valor, descripcion: row.descripcion };
    });
    res.json(configObj);
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({ message: "Error al obtener configuración" });
  }
};

// Actualizar una configuración específica
exports.updateConfiguracion = async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    await pool.query("UPDATE configuraciones SET valor = ? WHERE clave = ?", [
      valor,
      clave,
    ]);
    res.json({ message: "Configuración actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    res.status(500).json({ message: "Error al actualizar configuración" });
  }
};

// Subir logo personalizado
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Actualizar en la base de datos
    await pool.query(
      "UPDATE configuraciones SET valor = ? WHERE clave = 'logo_url'",
      [logoUrl],
    );

    res.json({
      message: "Logo subido exitosamente",
      logoUrl,
    });
  } catch (error) {
    console.error("Error al subir logo:", error);
    res.status(500).json({ message: "Error al subir logo" });
  }
};

// Obtener logo actual
exports.getLogo = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT valor FROM configuraciones WHERE clave = 'logo_url'",
    );
    const logoUrl = rows.length > 0 ? rows[0].valor : "/logos/default.png";
    res.json({ logoUrl });
  } catch (error) {
    res.json({ logoUrl: "/logos/default.png" });
  }
};
