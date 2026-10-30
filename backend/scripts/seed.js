// Datos de demostración para la sustentación. Seguro de correr varias veces.
const bcrypt = require('bcryptjs');
const Usuario = require('../src/models/usuario.model');
const Mascota = require('../src/models/mascota.model');
const { crearOPromoverAdministrador } = require('../src/services/auth.service');

crearOPromoverAdministrador({ email: 'admin@petstyle.com', nombre: 'Administrador PetStyle', password: 'admin123' });

let cliente = Usuario.buscarPorEmail('cliente@petstyle.com');
if (!cliente) {
  cliente = Usuario.crear({
    nombre: 'Ana Gómez', email: 'cliente@petstyle.com', telefono: '3001234567',
    passwordHash: bcrypt.hashSync('cliente123', 10), rol: 'CLIENTE'
  });
}
if (Mascota.listarPorUsuario(cliente.id).length === 0) {
  Mascota.crear(cliente.id, { nombre: 'Jack', especie: 'Perro', raza: 'Cocker', edad: 3 });
}

console.log('✔ Datos de demo listos:');
console.log('   Administrador -> admin@petstyle.com   / admin123');
console.log('   Cliente       -> cliente@petstyle.com / cliente123');
