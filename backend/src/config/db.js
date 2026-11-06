// Conexión a PostgreSQL (Neon, Supabase, Render o local). Lee DATABASE_URL.
const fs = require('fs');
const { Pool } = require('pg');
const { DATABASE_URL, SCHEMA_PATH } = require('./index');

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,        // los servicios en la nube cierran conexiones inactivas
  connectionTimeoutMillis: 15000   // Neon puede tardar unos segundos en "despertar"
});

// Sin este manejador, una conexión inactiva cerrada por el servidor tumbaría el proceso.
pool.on('error', (err) => console.error('Error en una conexión inactiva de la BD:', err.message));

const query = (texto, params) => pool.query(texto, params);

// Crea las tablas si no existen (idempotente). Se llama una vez al arrancar.
async function iniciarBD() {
  await pool.query(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

const cerrar = () => pool.end();

module.exports = { query, iniciarBD, cerrar };
