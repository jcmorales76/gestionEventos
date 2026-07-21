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
    await pool.query(
      "INSERT IGNORE INTO configuraciones (clave, valor, descripcion) VALUES ('minutos_inactividad','30','Minutos de inactividad antes de cerrar la sesión automáticamente')",
    );

    // Registro de descargas (certificados y materiales)
    await pool.query(`CREATE TABLE IF NOT EXISTS descargas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo ENUM('certificado','material') NOT NULL,
      referencia_id INT NOT NULL,
      usuario_id INT NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tipo_ref (tipo, referencia_id),
      INDEX idx_usuario (usuario_id)
    )`);

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

    // ===== Módulo de Análisis de Ingresos (Auspicio + Inscritos) =====
    // Configuración financiera por evento (moneda, IGV y metas).
    await pool.query(`CREATE TABLE IF NOT EXISTS finanzas_config (
      evento_id INT PRIMARY KEY,
      moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
      igv_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 18.00,
      meta_inscritos DECIMAL(12,2) NOT NULL DEFAULT 0,
      meta_auspicios DECIMAL(12,2) NOT NULL DEFAULT 0,
      actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Cuadro de precios de inscripción por tramos (configurable por evento).
    await pool.query(`CREATE TABLE IF NOT EXISTS finanzas_tramos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      evento_id INT NOT NULL,
      tramo_min INT NOT NULL,
      tramo_max INT NULL,
      precio_unitario DECIMAL(10,2) NOT NULL,
      INDEX idx_evento (evento_id)
    )`);

    // Lotes de inscritos por empresa (corazón del cálculo por lotes).
    await pool.query(`CREATE TABLE IF NOT EXISTS finanzas_lotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      evento_id INT NOT NULL,
      empresa VARCHAR(200) NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(10,2) NOT NULL,
      precio_manual TINYINT(1) NOT NULL DEFAULT 0,
      acumulado_hasta INT NOT NULL DEFAULT 0,
      estado ENUM('registrado','factura_solicitada','factura_enviada','pagado') NOT NULL DEFAULT 'registrado',
      modalidad VARCHAR(50) NULL,
      observacion VARCHAR(300) NULL,
      origen ENUM('manual','sync') NOT NULL DEFAULT 'manual',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_evento_empresa (evento_id, empresa)
    )`);

    // Auspicios por evento (monto negociado por patrocinador).
    await pool.query(`CREATE TABLE IF NOT EXISTS finanzas_auspicios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      evento_id INT NOT NULL,
      patrocinador VARCHAR(200) NOT NULL,
      categoria VARCHAR(80) NULL,
      monto DECIMAL(12,2) NOT NULL DEFAULT 0,
      incluye_igv TINYINT(1) NOT NULL DEFAULT 0,
      entradas_incluidas INT NOT NULL DEFAULT 0,
      costo_entrada DECIMAL(10,2) NOT NULL DEFAULT 0,
      estado ENUM('registrado','factura_solicitada','factura_enviada','pagado') NOT NULL DEFAULT 'registrado',
      observacion VARCHAR(300) NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_evento (evento_id)
    )`);

    // Flag: el monto del auspicio ya incluye IGV (bruto) o es neto.
    const [ci] = await pool.query(
      "SHOW COLUMNS FROM finanzas_auspicios LIKE 'incluye_igv'",
    );
    if (ci.length === 0) {
      await pool.query(
        "ALTER TABLE finanzas_auspicios ADD COLUMN incluye_igv TINYINT(1) NOT NULL DEFAULT 0",
      );
    }

    // Fechas de compromiso de pago y de pago real (proyección de flujo).
    for (const tabla of ["finanzas_lotes", "finanzas_auspicios"]) {
      const [fc] = await pool.query(
        `SHOW COLUMNS FROM ${tabla} LIKE 'fecha_compromiso'`,
      );
      if (fc.length === 0) {
        await pool.query(
          `ALTER TABLE ${tabla} ADD COLUMN fecha_compromiso DATE NULL`,
        );
      }
      const [fp] = await pool.query(`SHOW COLUMNS FROM ${tabla} LIKE 'fecha_pago'`);
      if (fp.length === 0) {
        await pool.query(`ALTER TABLE ${tabla} ADD COLUMN fecha_pago DATE NULL`);
      }
    }

    // Categorías de auspicio sugeridas por evento (para el selector).
    await pool.query(`CREATE TABLE IF NOT EXISTS finanzas_categorias_auspicio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      evento_id INT NOT NULL,
      nombre VARCHAR(80) NOT NULL,
      monto_referencia DECIMAL(12,2) NULL,
      entradas_referencia INT NULL,
      INDEX idx_evento (evento_id)
    )`);

    // Bitácora de auditoría global (trazabilidad de acciones de usuarios).
    await pool.query(`CREATE TABLE IF NOT EXISTS auditoria (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NULL,
      usuario_nombre VARCHAR(200) NULL,
      rol VARCHAR(50) NULL,
      accion VARCHAR(40) NOT NULL,
      modulo VARCHAR(60) NOT NULL,
      entidad_id INT NULL,
      descripcion VARCHAR(400) NULL,
      ip VARCHAR(60) NULL,
      metodo VARCHAR(10) NULL,
      ruta VARCHAR(255) NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_aud_usuario (usuario_id),
      INDEX idx_aud_modulo (modulo),
      INDEX idx_aud_accion (accion),
      INDEX idx_aud_fecha (fecha)
    )`);

    // Historial de cambios (auditoría) del módulo financiero.
    await pool.query(`CREATE TABLE IF NOT EXISTS finanzas_historial (
      id INT AUTO_INCREMENT PRIMARY KEY,
      evento_id INT NOT NULL,
      entidad ENUM('lote','auspicio','tramo','config','categoria') NOT NULL,
      entidad_id INT NULL,
      empresa VARCHAR(200) NULL,
      accion ENUM('crear','editar','eliminar','sincronizar') NOT NULL,
      detalle TEXT NULL,
      usuario_id INT NULL,
      usuario_nombre VARCHAR(200) NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_evento (evento_id)
    )`);
  } catch (e) {
    console.error("Error migrando esquema:", e.message);
  }
}

module.exports = { migrarEsquema };
