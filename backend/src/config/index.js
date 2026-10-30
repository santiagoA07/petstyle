// Configuración central (lee variables de entorno; ver .env.example)
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }
  // Solo desarrollo: las sesiones se invalidan cada vez que se reinicia el servidor
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠  JWT_SECRET no definido: usando uno temporal (solo desarrollo).');
}

const RAIZ_BACKEND = path.join(__dirname, '..', '..');
const RAIZ_PROYECTO = path.join(RAIZ_BACKEND, '..');

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET,
  JWT_EXPIRES: '8h',
  DB_PATH: process.env.DB_PATH || path.join(RAIZ_BACKEND, 'data', 'petstyle.db'),
  SCHEMA_PATH: path.join(RAIZ_PROYECTO, 'database', 'schema.sql'),
  FRONTEND_DIR: path.join(RAIZ_PROYECTO, 'frontend'),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_NOMBRE: process.env.ADMIN_NOMBRE || 'Administrador PetStyle'
};
