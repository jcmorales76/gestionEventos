# Despliegue en cPanel (una sola app Node)

Arquitectura: **una app Node** sirve la API (`/api`), los archivos (`/uploads`) y el
frontend de React (build en `backend/public`). Todo en el mismo dominio → el frontend
usa rutas **relativas**.

## Requisitos del hosting (ya verificados)
- Setup Node.js App (Passenger) con Node ≥ 18 → usar **20.20.2**
- MySQL + phpMyAdmin
- SSL (AutoSSL)

## 1. Preparar el paquete (en tu PC)
```bash
# 1. Build del frontend
cd frontend
npm run build

# 2. Copiar el build a backend/public
#    (crea la carpeta public dentro de backend con el contenido de dist)
#    Windows PowerShell:
#    Remove-Item -Recurse -Force ..\backend\public -ErrorAction Ignore
#    Copy-Item -Recurse dist ..\backend\public
```
El backend ya está preparado para servir `backend/public` automáticamente si existe.

## 2. Base de datos
```bash
# Exportar la BD local
mysqldump -u root eventflow_db > eventflow_db.sql
```
En cPanel:
1. **MySQL Databases** → crear base de datos + usuario (anota el prefijo, ej. `cuenta_eventflow`).
2. Asignar el usuario a la BD con todos los permisos.
3. **phpMyAdmin** → seleccionar la BD → Importar → subir `eventflow_db.sql`.

## 3. Subir el backend
Sube la carpeta `backend/` (con `public/` dentro, **sin** `node_modules`) al servidor,
por ejemplo a `/home/tuusuario/eventflow-api` (File Manager con zip, o git/SSH).

## 4. Crear la app Node en cPanel
**Setup Node.js App → Create Application**
- **Node.js version**: 20.20.2
- **Application mode**: Production
- **Application root**: ruta donde subiste el backend (ej. `eventflow-api`)
- **Application URL**: el dominio o subdominio donde vivirá la app
- **Application startup file**: `server.js`

**Environment variables** (botón ADD VARIABLE):
- `DB_HOST` = `localhost`
- `DB_PORT` = `3306`
- `DB_USER` = tu usuario MySQL de cPanel (con prefijo)
- `DB_PASSWORD` = la contraseña
- `DB_NAME` = tu base de datos (con prefijo)
- **NO** definir `PORT` (lo asigna el hosting)

Luego: **Run NPM Install** → **Restart**.

## 5. Permisos y archivos
- La carpeta `backend/uploads` debe existir y tener permisos de escritura
  (logos, materiales, certificados, avatars se guardan ahí).

## 6. SSL
- cPanel → SSL/TLS Status → **Run AutoSSL** y probar en `https://`.

## Notas
- Si prefieres **subdominio para la API** (ej. `api.tudominio.com`) en vez de servir
  todo junto, habría que volver a URLs absolutas con una variable `VITE_API_URL`.
  La opción de una sola app (esta guía) es más simple.
- Correos automáticos (Nodemailer + SMTP de cPanel) quedan como mejora posterior.
