const db = require('../config/db');

// Cita + datos de la mascota + contacto del cliente (el administrador lo necesita)
const SELECT_CITA = `
  SELECT c.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie, m.raza AS mascota_raza,
         u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
  FROM citas c
  JOIN mascotas m ON m.id = c.mascota_id
  JOIN usuarios u ON u.id = c.usuario_id`;

const normalizar = (c) => (c ? { ...c, requiere_ruta: !!c.requiere_ruta } : c);

const buscarPorId = (id) => normalizar(db.prepare(`${SELECT_CITA} WHERE c.id = ?`).get(id));
const listarPorUsuario = (usuarioId) =>
  db.prepare(`${SELECT_CITA} WHERE c.usuario_id = ? ORDER BY c.fecha_hora DESC`).all(usuarioId).map(normalizar);
const listarTodas = () => db.prepare(`${SELECT_CITA} ORDER BY c.fecha_hora ASC`).all().map(normalizar);

function crear(d) {
  const info = db.prepare(
    `INSERT INTO citas (usuario_id, mascota_id, servicio, estilo_corte, especificaciones, requiere_ruta, direccion, fecha_hora, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')`
  ).run(d.usuarioId, d.mascotaId, d.servicio, d.estiloCorte, d.especificaciones,
        d.requiereRuta ? 1 : 0, d.direccion, d.fechaHora);
  return buscarPorId(info.lastInsertRowid);
}

function actualizarEstado(id, estado) {
  db.prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, id);
  return buscarPorId(id);
}

module.exports = { buscarPorId, listarPorUsuario, listarTodas, crear, actualizarEstado };
