const Cita = require('../models/cita.model');
const Mascota = require('../models/mascota.model');
const { HttpError } = require('../middlewares/error');

const ESTADOS = ['Pendiente', 'Aprobada', 'En proceso', 'Rechazada', 'Entregada', 'Cancelada'];
// Transiciones que puede hacer el administrador (un clic cada una)
const TRANSICIONES_ADMIN = {
  'Pendiente':  ['Aprobada', 'Rechazada'],
  'Aprobada':   ['En proceso', 'Rechazada'],
  'En proceso': ['Entregada']
};
const texto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

// FN-03 · Agendamiento con servicio de ruta condicional
function crear(usuario, body = {}) {
  const mascota = Mascota.buscarDeUsuario(body.mascota_id, usuario.id);
  if (!mascota) throw new HttpError(400, 'Debe seleccionar una mascota registrada');
  if (!texto(body.servicio, 80)) throw new HttpError(400, 'Debe seleccionar al menos un servicio para continuar');

  const fecha = new Date(body.fecha_hora);
  if (!body.fecha_hora || Number.isNaN(fecha.getTime())) throw new HttpError(400, 'Fecha y hora inválidas');
  if (fecha < new Date()) throw new HttpError(400, 'La fecha de la cita no puede ser anterior a hoy');

  const requiereRuta = !!body.requiere_ruta;
  if (requiereRuta && !texto(body.direccion, 250)) {
    throw new HttpError(400, 'Debe ingresar una dirección para solicitar ruta');
  }

  return Cita.crear({
    usuarioId: usuario.id,
    mascotaId: mascota.id,
    servicio: body.servicio.trim(),
    estiloCorte: (body.estilo_corte || '').trim() || null,
    especificaciones: (body.especificaciones || '').trim() || null,
    requiereRuta,
    direccion: requiereRuta ? body.direccion.trim() : null,
    fechaHora: body.fecha_hora
  });
}

const listarDeUsuario = (usuario) => Cita.listarPorUsuario(usuario.id);
const listarTodas = () => Cita.listarTodas();

// FN-04 · El administrador avanza el estado (no puede saltarse pasos)
function cambiarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) throw new HttpError(400, 'Estado inválido');
  const cita = Cita.buscarPorId(id);
  if (!cita) throw new HttpError(404, 'Cita no encontrada');
  if (!(TRANSICIONES_ADMIN[cita.estado] || []).includes(estado)) {
    throw new HttpError(409, `No se puede pasar de "${cita.estado}" a "${estado}"`);
  }
  return Cita.actualizarEstado(cita.id, estado);
}

// HU-PET-007 · El cliente cancela solo citas propias que sigan Pendientes
function cancelar(usuario, id) {
  const cita = Cita.buscarPorId(id);
  if (!cita || cita.usuario_id !== usuario.id) throw new HttpError(404, 'Acceso no autorizado');
  if (cita.estado !== 'Pendiente') {
    throw new HttpError(409, 'No es posible cancelar una cita que ya fue atendida o está en proceso');
  }
  return Cita.actualizarEstado(cita.id, 'Cancelada');
}

module.exports = { ESTADOS, crear, listarDeUsuario, listarTodas, cambiarEstado, cancelar };
