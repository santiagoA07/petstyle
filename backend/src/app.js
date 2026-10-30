// Aplicación Express (sin listen, para poder probarla)
const express = require('express');
const config = require('./config');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/error');

const app = express();
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/mascotas', require('./routes/mascotas.routes'));
app.use('/api/citas', require('./routes/citas.routes'));
app.use('/api', rutaNoEncontrada);

// Frontend estático (SPA)
app.use(express.static(config.FRONTEND_DIR));

app.use(manejadorErrores);

module.exports = app;
