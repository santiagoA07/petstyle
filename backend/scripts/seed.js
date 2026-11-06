// Datos de demostración (SOLO para desarrollo). Seguro de correr varias veces.
// ⚠ No lo ejecutes contra la base de producción: crea cuentas con contraseñas públicas.
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const Usuario = require('../src/models/usuario.model');
const Mascota = require('../src/models/mascota.model');
const { crearOPromoverAdministrador } = require('../src/services/auth.service');

(async () => {
  await db.iniciarBD();
  await crearOPromoverAdministrador({ email: 'admin@petstyle.com', nombre: 'Administrador PetStyle', password: 'admin123' });

  let cliente = await Usuario.buscarPorEmail('cliente@petstyle.com');
  if (!cliente) {
    cliente = await Usuario.crear({
      nombre: 'Ana Gómez', email: 'cliente@petstyle.com', telefono: '3001234567',
      passwordHash: await bcrypt.hash('cliente123', 10), rol: 'CLIENTE'
    });
  }
  if ((await Mascota.listarPorUsuario(cliente.id)).length === 0) {
    await Mascota.crear(cliente.id, { nombre: 'Jack', especie: 'Perro', raza: 'Cocker', edad: 3 });
  }

  console.log('✔ Datos de demo listos:');
  console.log('   Administrador -> admin@petstyle.com   / admin123');
  console.log('   Cliente       -> cliente@petstyle.com / cliente123');
})()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => db.cerrar());
