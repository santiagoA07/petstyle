// Pruebas de integración: login con dos roles, vistas protegidas y flujo principal.
// Ejecutar desde backend/:  npm test
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto-de-pruebas';

const test = require('node:test');
const assert = require('node:assert/strict');
const { crearOPromoverAdministrador } = require('../backend/src/services/auth.service');
const app = require('../backend/src/app');

let servidor, base;
test.before(async () => {
  crearOPromoverAdministrador({ email: 'admin@test.com', nombre: 'Admin', password: 'admin123' });
  await new Promise((ok) => { servidor = app.listen(0, ok); });
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
test.after(() => servidor.close());

async function http(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  return { status: r.status, data: await r.json() };
}

const cliente = { nombre: 'Luis', email: 'luis@test.com', telefono: '3001112233', password: 'abcdef' };
let tokenCliente, tokenAdmin, mascotaId, citaId;

test('registro: siempre crea CLIENTE aunque se envíe rol ADMINISTRADOR', async () => {
  const r = await http('POST', '/auth/registro', { ...cliente, rol: 'ADMINISTRADOR' });
  assert.equal(r.status, 201);
  assert.equal(r.data.perfil.rol, 'CLIENTE');
});

test('registro: correo duplicado => 409 con el mensaje de la historia de usuario', async () => {
  const r = await http('POST', '/auth/registro', cliente);
  assert.equal(r.status, 409);
  assert.match(r.data.error, /ya se encuentra registrado/);
});

test('login: credenciales inválidas => 401', async () => {
  const r = await http('POST', '/auth/login', { email: cliente.email, password: 'mala', rol: 'CLIENTE' });
  assert.equal(r.status, 401);
  assert.match(r.data.error, /Credenciales inválidas/);
});

test('login cliente: con acceso CLIENTE entra; con acceso ADMINISTRADOR se rechaza', async () => {
  const ok = await http('POST', '/auth/login', { email: cliente.email, password: cliente.password, rol: 'CLIENTE' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.perfil.rol, 'CLIENTE');
  tokenCliente = ok.data.token;

  const mal = await http('POST', '/auth/login', { email: cliente.email, password: cliente.password, rol: 'ADMINISTRADOR' });
  assert.equal(mal.status, 403);
});

test('login administrador: con acceso ADMINISTRADOR entra; con acceso CLIENTE se rechaza', async () => {
  const ok = await http('POST', '/auth/login', { email: 'admin@test.com', password: 'admin123', rol: 'ADMINISTRADOR' });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.perfil.rol, 'ADMINISTRADOR');
  tokenAdmin = ok.data.token;

  const mal = await http('POST', '/auth/login', { email: 'admin@test.com', password: 'admin123', rol: 'CLIENTE' });
  assert.equal(mal.status, 403);
});

test('RBAC: cada rol solo accede a su zona; sin token => 401', async () => {
  assert.equal((await http('GET', '/mascotas')).status, 401);
  assert.equal((await http('GET', '/citas', null, tokenCliente)).status, 403);   // cliente -> panel admin
  assert.equal((await http('GET', '/mascotas', null, tokenAdmin)).status, 403);  // admin -> zona cliente
  assert.equal((await http('GET', '/citas/mias', null, tokenAdmin)).status, 403);
});

test('flujo cliente: crea mascota y agenda cita con ruta (queda Pendiente)', async () => {
  const m = await http('POST', '/mascotas', { nombre: 'Toby', especie: 'Perro', raza: 'Golden', edad: 3 }, tokenCliente);
  assert.equal(m.status, 201);
  mascotaId = m.data.id;

  const sinDireccion = await http('POST', '/citas',
    { mascota_id: mascotaId, servicio: 'Solo Baño', requiere_ruta: true, fecha_hora: '2035-01-10T10:00' }, tokenCliente);
  assert.equal(sinDireccion.status, 400);

  const c = await http('POST', '/citas', {
    mascota_id: mascotaId, servicio: 'Solo Baño', requiere_ruta: true,
    direccion: 'Calle 1 #2-3', fecha_hora: '2035-01-10T10:00'
  }, tokenCliente);
  assert.equal(c.status, 201);
  assert.equal(c.data.estado, 'Pendiente');
  citaId = c.data.id;
});

test('flujo administrador: ve contacto del cliente y recorre el ciclo de estados', async () => {
  const lista = await http('GET', '/citas', null, tokenAdmin);
  const cita = lista.data.find((x) => x.id === citaId);
  assert.equal(cita.cliente_telefono, '3001112233');
  assert.equal(cita.direccion, 'Calle 1 #2-3');

  assert.equal((await http('PATCH', `/citas/${citaId}/estado`, { estado: 'Entregada' }, tokenAdmin)).status, 409); // salto
  for (const estado of ['Aprobada', 'En proceso']) {
    const r = await http('PATCH', `/citas/${citaId}/estado`, { estado }, tokenAdmin);
    assert.equal(r.data.estado, estado);
  }
  const mias = await http('GET', '/citas/mias', null, tokenCliente);
  assert.equal(mias.data[0].estado, 'En proceso'); // el cliente ve el estado actualizado
});

test('el cliente no puede cambiar estados ni cancelar una cita ya en proceso', async () => {
  assert.equal((await http('PATCH', `/citas/${citaId}/estado`, { estado: 'Entregada' }, tokenCliente)).status, 403);
  assert.equal((await http('PATCH', `/citas/${citaId}/cancelar`, null, tokenCliente)).status, 409);
});

test('el cliente puede cancelar una cita Pendiente propia', async () => {
  const c = await http('POST', '/citas', { mascota_id: mascotaId, servicio: 'Solo Baño', fecha_hora: '2035-02-10T10:00' }, tokenCliente);
  const r = await http('PATCH', `/citas/${c.data.id}/cancelar`, null, tokenCliente);
  assert.equal(r.data.estado, 'Cancelada');
});
