// RBAC: autenticación (¿quién eres?) y autorización por rol (¿qué puedes hacer?)
const { usuarioDesdeToken } = require('../services/auth.service');
const { HttpError } = require('./error');

function requireAuth(req, _res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) return next(new HttpError(401, 'No autenticado'));
  const usuario = usuarioDesdeToken(token);
  if (!usuario) return next(new HttpError(401, 'Sesión expirada o inválida'));
  req.user = usuario;
  next();
}

const requireRol = (rol) => (req, _res, next) =>
  req.user && req.user.rol === rol
    ? next()
    : next(new HttpError(403, 'Zona restringida: no tienes permiso para esta acción'));

module.exports = { requireAuth, requireRol };
