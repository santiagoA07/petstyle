// Uso:
//   npm run crear-admin -- correo@ejemplo.com                      (promueve una cuenta existente)
//   npm run crear-admin -- correo@ejemplo.com "Nombre" "contraseña" (crea una cuenta nueva)
const { crearOPromoverAdministrador } = require('../src/services/auth.service');

const [email, nombre, password] = process.argv.slice(2);
if (!email) {
  console.log('Uso: npm run crear-admin -- <correo> ["Nombre"] ["contraseña"]');
  process.exit(1);
}
try {
  const { creado } = crearOPromoverAdministrador({ email, nombre, password });
  console.log(creado ? `✔ Administrador creado: ${email}` : `✔ ${email} ahora es ADMINISTRADOR.`);
} catch (e) {
  console.log(e.message);
  process.exit(1);
}
