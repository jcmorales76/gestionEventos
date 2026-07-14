const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Fecha antigua para forzar el cambio de contraseña en el primer login
// (el mecanismo de expiración del login la detecta como "vencida").
const FORZAR_CAMBIO = "2000-01-01 00:00:00";

let transporter = null;

function estaConfigurado() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

function getTransporter() {
  if (transporter) return transporter;
  if (!estaConfigurado()) return null;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

// Genera una contraseña temporal legible (sin caracteres ambiguos)
function generarPasswordTemporal(len = 8) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function enviarCorreo({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn("✉️  SMTP no configurado; se omite el correo a", to);
    return { ok: false, skipped: true };
  }
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await t.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (err) {
    console.error("✉️  Error enviando correo a", to, "-", err.message);
    return { ok: false, error: err.message };
  }
}

function plantilla({ nombre, email, tempPassword, eventoNombre }) {
  const appUrl = process.env.APP_URL || "";
  const loginLink = appUrl ? `${appUrl}/login` : "";
  const bloqueCredenciales = tempPassword
    ? `
      <p>Estos son tus datos de acceso:</p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:12px 0;">
        <p style="margin:4px 0;">Usuario: <strong>${email}</strong></p>
        <p style="margin:4px 0;">Contraseña temporal: <strong style="letter-spacing:1px;">${tempPassword}</strong></p>
      </div>
      <p style="color:#b91c1c;"><strong>Por seguridad, deberás cambiar tu contraseña la primera vez que inicies sesión.</strong></p>`
    : "";
  return `
  <div style="font-family: Arial, sans-serif; max-width:560px; margin:0 auto; color:#0f172a;">
    <div style="background:linear-gradient(135deg,#ef4444,#b91c1c); padding:22px; border-radius:12px 12px 0 0; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:19px;">FEPCMAC · Gestión de Eventos</h1>
    </div>
    <div style="border:1px solid #e2e8f0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
      <p>Hola <strong>${nombre}</strong>,</p>
      ${
        eventoNombre
          ? `<p>Has sido inscrito(a) en: <strong>${eventoNombre}</strong>.</p>`
          : `<p>Se ha creado tu cuenta en la plataforma.</p>`
      }
      ${bloqueCredenciales}
      ${
        loginLink
          ? `<p style="text-align:center; margin:24px 0;"><a href="${loginLink}" style="background:#dc2626; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; display:inline-block;">Iniciar sesión</a></p>`
          : ""
      }
      <p style="color:#64748b; font-size:12px; margin-top:24px;">Si no esperabas este correo, puedes ignorarlo.</p>
    </div>
  </div>`;
}

// Correo de bienvenida/inscripción. Si se pasa tempPassword, incluye credenciales.
async function enviarBienvenida({ email, nombre, tempPassword, eventoNombre }) {
  const subject = eventoNombre
    ? `Inscripción confirmada: ${eventoNombre}`
    : "Bienvenido(a) a FEPCMAC · Gestión de Eventos";
  return enviarCorreo({
    to: email,
    subject,
    html: plantilla({ nombre, email, tempPassword, eventoNombre }),
  });
}

module.exports = {
  FORZAR_CAMBIO,
  estaConfigurado,
  generarPasswordTemporal,
  enviarCorreo,
  enviarBienvenida,
};
