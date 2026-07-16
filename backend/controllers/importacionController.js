const pool = require("../config/db");
const {
  enviarBienvenida,
  generarPasswordTemporal,
  FORZAR_CAMBIO,
} = require("../config/mailer");
const { hashPassword } = require("../utils/security");

// Importación masiva de participantes a un evento.
// Por cada fila: crea el usuario si no existe (contraseña = DNI o "123456"),
// y lo inscribe en el evento si aún no lo estaba.
exports.importarParticipantes = async (req, res) => {
  try {
    const { eventoId, participantes, calidad } = req.body;

    if (!eventoId) {
      return res
        .status(400)
        .json({ message: "Debes seleccionar un evento destino" });
    }
    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res
        .status(400)
        .json({ message: "No hay participantes para importar" });
    }

    // Validar que el evento exista
    const [evRows] = await pool.query(
      "SELECT id, nombre FROM eventos WHERE id = ?",
      [eventoId],
    );
    if (evRows.length === 0) {
      return res
        .status(404)
        .json({ message: "El evento seleccionado no existe" });
    }

    const eventoNombre = evRows[0].nombre;

    const resumen = {
      total: participantes.length,
      usuariosCreados: 0,
      usuariosExistentes: 0,
      inscripcionesNuevas: 0,
      yaInscritos: 0,
      correosEnviados: 0,
      errores: [],
    };

    for (let i = 0; i < participantes.length; i++) {
      const p = participantes[i] || {};
      const fila = i + 2; // +2 porque la fila 1 del archivo es el encabezado
      const email = (p.email || "").toString().trim().toLowerCase();
      const nombre = (p.nombre || "").toString().trim();
      const apellido = (p.apellido || "").toString().trim();
      const dni = (p.dni || "").toString().trim();
      const telefono = (p.telefono || "").toString().trim();
      const empresa = (p.empresa || "").toString().trim();

      if (!email || !nombre) {
        resumen.errores.push(`Fila ${fila}: falta nombre o email`);
        continue;
      }

      try {
        // 1. Buscar usuario por email
        const [userRows] = await pool.query(
          "SELECT id FROM usuarios WHERE email = ?",
          [email],
        );

        let userId;
        let esNuevo = false;
        let tempPassword = null;
        if (userRows.length > 0) {
          userId = userRows[0].id;
          resumen.usuariosExistentes++;
        } else {
          // Contraseña temporal + forzar cambio en el primer login
          tempPassword = dni || generarPasswordTemporal();
          const hash = await hashPassword(tempPassword);
          const [ins] = await pool.query(
            'INSERT INTO usuarios (nombre, apellido, email, password, rol, dni, telefono, estado, empresa, password_changed_at) VALUES (?, ?, ?, ?, "participante", ?, ?, "Activo", ?, ?)',
            [nombre, apellido, email, hash, dni, telefono, empresa || null, FORZAR_CAMBIO],
          );
          userId = ins.insertId;
          esNuevo = true;
          resumen.usuariosCreados++;
        }

        // 2. ¿Ya está inscrito en el evento?
        const [inscRows] = await pool.query(
          "SELECT id FROM inscripciones WHERE usuario_id = ? AND evento_id = ?",
          [userId, eventoId],
        );

        let inscritoAhora = false;
        if (inscRows.length > 0) {
          resumen.yaInscritos++;
        } else {
          await pool.query(
            "INSERT INTO inscripciones (usuario_id, evento_id, calidad) VALUES (?, ?, ?)",
            [userId, eventoId, calidad || "Participante"],
          );
          resumen.inscripcionesNuevas++;
          inscritoAhora = true;
        }

        // 3. Correo: a los nuevos con sus credenciales; a los existentes
        //    recién inscritos, solo el aviso de inscripción.
        if (esNuevo || inscritoAhora) {
          const correo = await enviarBienvenida({
            email,
            nombre: `${nombre} ${apellido}`.trim(),
            tempPassword: esNuevo ? tempPassword : null,
            eventoNombre,
          });
          if (correo.ok) resumen.correosEnviados++;
        }
      } catch (err) {
        console.error(`Error importando fila ${fila}:`, err.message);
        resumen.errores.push(`Fila ${fila} (${email}): ${err.message}`);
      }
    }

    res.json({
      message: `Importación completada para "${evRows[0].nombre}"`,
      resumen,
    });
  } catch (error) {
    console.error("Error en importación masiva:", error);
    res.status(500).json({ message: "Error en la importación masiva" });
  }
};
