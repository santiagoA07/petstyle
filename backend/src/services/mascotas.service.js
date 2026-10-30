const Mascota = require('../models/mascota.model');
const { HttpError } = require('../middlewares/error');

const texto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function validar({ nombre, especie, raza, edad } = {}) {
  if (!texto(nombre, 80) || !texto(raza, 80)) throw new HttpError(400, 'Por favor complete los campos obligatorios');
  if (!['Perro', 'Gato'].includes(especie)) throw new HttpError(400, 'Especie inválida');
  let edadNum = null;
  if (edad !== null && edad !== undefined && edad !== '') {
    edadNum = Number.parseInt(edad, 10);
    if (!Number.isInteger(edadNum) || edadNum < 0 || edadNum > 40) {
      throw new HttpError(400, 'La edad debe estar entre 0 y 40');
    }
  }
  return { nombre: nombre.trim(), especie, raza: raza.trim(), edad: edadNum };
}

const listar = (usuario) => Mascota.listarPorUsuario(usuario.id);
const crear = (usuario, body) => Mascota.crear(usuario.id, validar(body));

function actualizar(usuario, id, body) {
  const mascota = Mascota.actualizar(id, usuario.id, validar(body));
  if (!mascota) throw new HttpError(404, 'Acceso no autorizado');
  return mascota;
}

function eliminar(usuario, id) {
  try {
    if (!Mascota.eliminar(id, usuario.id)) throw new HttpError(404, 'Acceso no autorizado');
  } catch (e) {
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) {
      throw new HttpError(409, 'No se puede eliminar: esta mascota tiene citas registradas.');
    }
    throw e;
  }
}

module.exports = { listar, crear, actualizar, eliminar };
