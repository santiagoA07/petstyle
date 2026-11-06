const db = require('../config/db');

// El correo se compara sin distinguir mayúsculas (hay un índice único sobre lower(email))
async function buscarPorEmail(email) {
  const { rows } = await db.query('SELECT * FROM usuarios WHERE lower(email) = lower($1)', [email]);
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return rows[0];
}

async function crear({ nombre, email, telefono, passwordHash, rol }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, email, telefono || '', passwordHash, rol]
  );
  return rows[0];
}

const cambiarRol = (id, rol) => db.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);

async function existeAdministrador() {
  const { rowCount } = await db.query(`SELECT 1 FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1`);
  return rowCount > 0;
}

module.exports = { buscarPorEmail, buscarPorId, crear, cambiarRol, existeAdministrador };
