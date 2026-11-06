// Error con código HTTP; los servicios lo lanzan y el manejador lo convierte en JSON.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 no captura los errores de funciones async: este envoltorio los pasa al manejador.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === '22P02' || err.code === '22003') return res.status(400).json({ error: 'Dato o identificador inválido' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { HttpError, asyncHandler, rutaNoEncontrada, manejadorErrores };
