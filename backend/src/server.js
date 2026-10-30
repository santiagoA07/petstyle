const config = require('./config');
const app = require('./app');
const { asegurarAdministradorInicial } = require('./services/auth.service');

asegurarAdministradorInicial();

app.listen(config.PORT, () => console.log(`🐾 PetStyle corriendo en http://localhost:${config.PORT}`));
