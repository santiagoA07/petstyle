const db = require('../config/db');

async function buscarPorId(id) {
  const { rows } = await db.query('SELECT * FROM mascotas WHERE id = $1', [id]);
  return rows[0];
}

async function buscarDeUsuario(id, usuarioId) {
  const { rows } = await db.query('SELECT * FROM mascotas WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
  return rows[0];
}

async function listarPorUsuario(usuarioId) {
  const { rows } = await db.query(
    'SELECT * FROM mascotas WHERE usuario_id = $1 ORDER BY lower(nombre), id', [usuarioId]
  );
  return rows;
}

async function crear(usuarioId, { nombre, especie, raza, edad }) {
  const { rows } = await db.query(
    `INSERT INTO mascotas (usuario_id, nombre, especie, raza, edad)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [usuarioId, nombre, especie, raza, edad]
  );
  return rows[0];
}

async function actualizar(id, usuarioId, { nombre, especie, raza, edad }) {
  const { rows } = await db.query(
    `UPDATE mascotas SET nombre = $1, especie = $2, raza = $3, edad = $4
     WHERE id = $5 AND usuario_id = $6 RETURNING *`,
    [nombre, especie, raza, edad, id, usuarioId]
  );
  return rows[0] || null;
}

async function eliminar(id, usuarioId) {
  const { rowCount } = await db.query('DELETE FROM mascotas WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
  return rowCount > 0;
}

module.exports = { buscarPorId, buscarDeUsuario, listarPorUsuario, crear, actualizar, eliminar };
