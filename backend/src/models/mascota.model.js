const db = require('../config/db');

const buscarPorId = (id) => db.prepare('SELECT * FROM mascotas WHERE id = ?').get(id);
const buscarDeUsuario = (id, usuarioId) =>
  db.prepare('SELECT * FROM mascotas WHERE id = ? AND usuario_id = ?').get(id, usuarioId);
const listarPorUsuario = (usuarioId) =>
  db.prepare('SELECT * FROM mascotas WHERE usuario_id = ? ORDER BY nombre COLLATE NOCASE').all(usuarioId);

function crear(usuarioId, { nombre, especie, raza, edad }) {
  const info = db.prepare(
    'INSERT INTO mascotas (usuario_id, nombre, especie, raza, edad) VALUES (?, ?, ?, ?, ?)'
  ).run(usuarioId, nombre, especie, raza, edad);
  return buscarPorId(info.lastInsertRowid);
}

function actualizar(id, usuarioId, { nombre, especie, raza, edad }) {
  const info = db.prepare(
    'UPDATE mascotas SET nombre = ?, especie = ?, raza = ?, edad = ? WHERE id = ? AND usuario_id = ?'
  ).run(nombre, especie, raza, edad, id, usuarioId);
  return info.changes > 0 ? buscarPorId(id) : null;
}

const eliminar = (id, usuarioId) =>
  db.prepare('DELETE FROM mascotas WHERE id = ? AND usuario_id = ?').run(id, usuarioId).changes > 0;

module.exports = { buscarPorId, buscarDeUsuario, listarPorUsuario, crear, actualizar, eliminar };
