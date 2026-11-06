const Mascotas = require('../services/mascotas.service');
const { asyncHandler } = require('../middlewares/error');

exports.listar = asyncHandler(async (req, res) => res.json(await Mascotas.listar(req.user)));
exports.crear = asyncHandler(async (req, res) => res.status(201).json(await Mascotas.crear(req.user, req.body)));
exports.actualizar = asyncHandler(async (req, res) =>
  res.json(await Mascotas.actualizar(req.user, req.params.id, req.body)));
exports.eliminar = asyncHandler(async (req, res) => {
  await Mascotas.eliminar(req.user, req.params.id);
  res.json({ ok: true });
});
