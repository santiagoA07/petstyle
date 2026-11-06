const config = require('./config');
const app = require('./app');
const db = require('./config/db');
const { asegurarAdministradorInicial } = require('./services/auth.service');

(async () => {
  await db.iniciarBD();                 // crea las tablas si no existen
  await asegurarAdministradorInicial(); // crea el admin inicial si no hay ninguno
  app.listen(config.PORT, () => console.log(`🐾 PetStyle corriendo en http://localhost:${config.PORT}`));
})().catch((err) => {
  console.error('No se pudo iniciar PetStyle (revisa DATABASE_URL):', err.message);
  process.exit(1);
});
