const db = require('../config/db');

const buscarPorEmail = (email) => db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
const buscarPorId = (id) => db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);

function crear({ nombre, email, telefono, passwordHash, rol }) {
  const info = db.prepare(
    'INSERT INTO usuarios (nombre, email, telefono, password_hash, rol) VALUES (?, ?, ?, ?, ?)'
  ).run(nombre, email, telefono || '', passwordHash, rol);
  return buscarPorId(info.lastInsertRowid);
}

const cambiarRol = (id, rol) => db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, id);
const existeAdministrador = () =>
  !!db.prepare(`SELECT 1 FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1`).get();

module.exports = { buscarPorEmail, buscarPorId, crear, cambiarRol, existeAdministrador };
