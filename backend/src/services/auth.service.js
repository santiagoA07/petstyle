const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const Usuario = require('../models/usuario.model');
const { HttpError } = require('../middlewares/error');

const ROLES = ['CLIENTE', 'ADMINISTRADOR'];
const texto = (v, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

const perfilPublico = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, telefono: u.telefono, rol: u.rol });
const firmarToken = (u) => jwt.sign({ id: u.id, rol: u.rol }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES });

// FN-01 · Registro público: SIEMPRE crea un CLIENTE (cualquier "rol" enviado se ignora).
function registrar({ nombre, email, telefono, password } = {}) {
  if (!texto(nombre, 100) || !texto(email, 150) || !texto(telefono, 30)) {
    throw new HttpError(400, 'Completa nombre, correo y teléfono');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new HttpError(400, 'El correo no es válido');
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'La contraseña debe tener mínimo 6 caracteres');
  }
  if (Usuario.buscarPorEmail(email.trim())) {
    throw new HttpError(409, 'El correo electrónico ya se encuentra registrado');
  }
  const usuario = Usuario.crear({
    nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim(),
    passwordHash: bcrypt.hashSync(password, 10), rol: 'CLIENTE'
  });
  return { token: firmarToken(usuario), perfil: perfilPublico(usuario) };
}

// FN-01 · Login con dos roles. `rol` es el tipo de acceso que el usuario eligió en la pantalla;
// el servidor comprueba que la cuenta realmente tenga ese rol (no se confía en el navegador).
function login({ email, password, rol } = {}) {
  if (!texto(email) || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'Ingresa correo y contraseña');
  }
  if (!ROLES.includes(rol)) throw new HttpError(400, 'Selecciona el tipo de acceso');

  const usuario = Usuario.buscarPorEmail(email.trim());
  if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
    throw new HttpError(401, 'Credenciales inválidas, verifique su usuario o contraseña');
  }
  if (usuario.rol !== rol) {
    throw new HttpError(403, usuario.rol === 'ADMINISTRADOR'
      ? 'Esta cuenta es de Administrador. Selecciona el acceso "Administrador".'
      : 'Esta cuenta no tiene permisos de Administrador.');
  }
  return { token: firmarToken(usuario), perfil: perfilPublico(usuario) };
}

// Devuelve el usuario actual a partir del token (se relee de la BD: un cambio de rol aplica al instante)
function usuarioDesdeToken(token) {
  try {
    const { id } = jwt.verify(token, config.JWT_SECRET);
    return Usuario.buscarPorId(id) || null;
  } catch {
    return null;
  }
}

// Crea un administrador o promueve una cuenta existente (solo lo usa el responsable del sistema)
function crearOPromoverAdministrador({ email, nombre, password }) {
  const existente = Usuario.buscarPorEmail(email);
  if (existente) {
    Usuario.cambiarRol(existente.id, 'ADMINISTRADOR');
    return { creado: false, usuario: Usuario.buscarPorId(existente.id) };
  }
  if (!nombre || !password) throw new Error('El correo no existe: indica también nombre y contraseña');
  const usuario = Usuario.crear({
    nombre, email, telefono: '', passwordHash: bcrypt.hashSync(password, 10), rol: 'ADMINISTRADOR'
  });
  return { creado: true, usuario };
}

// Si no hay ningún administrador y existen ADMIN_EMAIL / ADMIN_PASSWORD, crea el primero.
function asegurarAdministradorInicial() {
  if (Usuario.existeAdministrador()) return;
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) {
    console.warn('⚠  No hay administradores. Crea uno con: npm run crear-admin -- correo [nombre] [contraseña]');
    return;
  }
  crearOPromoverAdministrador({
    email: config.ADMIN_EMAIL, nombre: config.ADMIN_NOMBRE, password: config.ADMIN_PASSWORD
  });
  console.log(`✔ Administrador inicial creado: ${config.ADMIN_EMAIL}`);
}

module.exports = {
  ROLES, perfilPublico, registrar, login, usuarioDesdeToken,
  crearOPromoverAdministrador, asegurarAdministradorInicial
};
