const db = require('../config/db');

// Cita + datos de la mascota + contacto del cliente (el administrador lo necesita)
const SELECT_CITA = `
  SELECT c.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie, m.raza AS mascota_raza,
         u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
  FROM citas c
  JOIN mascotas m ON m.id = c.mascota_id
  JOIN usuarios u ON u.id = c.usuario_id`;

async function buscarPorId(id) {
  const { rows } = await db.query(`${SELECT_CITA} WHERE c.id = $1`, [id]);
  return rows[0];
}

async function listarPorUsuario(usuarioId) {
  const { rows } = await db.query(`${SELECT_CITA} WHERE c.usuario_id = $1 ORDER BY c.fecha_hora DESC, c.id DESC`, [usuarioId]);
  return rows;
}

async function listarTodas() {
  const { rows } = await db.query(`${SELECT_CITA} ORDER BY c.fecha_hora ASC, c.id ASC`);
  return rows;
}

async function crear(d) {
  const { rows } = await db.query(
    `INSERT INTO citas (usuario_id, mascota_id, servicio, estilo_corte, especificaciones, requiere_ruta, direccion, fecha_hora, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendiente') RETURNING id`,
    [d.usuarioId, d.mascotaId, d.servicio, d.estiloCorte, d.especificaciones,
     !!d.requiereRuta, d.direccion, d.fechaHora]
  );
  return buscarPorId(rows[0].id);
}

async function actualizarEstado(id, estado) {
  await db.query('UPDATE citas SET estado = $1 WHERE id = $2', [estado, id]);
  return buscarPorId(id);
}

module.exports = { buscarPorId, listarPorUsuario, listarTodas, crear, actualizarEstado };
