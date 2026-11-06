const Citas = require('../services/citas.service');
const { asyncHandler } = require('../middlewares/error');

exports.crear = asyncHandler(async (req, res) => res.status(201).json(await Citas.crear(req.user, req.body)));
exports.misCitas = asyncHandler(async (req, res) => res.json(await Citas.listarDeUsuario(req.user)));
exports.cancelar = asyncHandler(async (req, res) => res.json(await Citas.cancelar(req.user, req.params.id)));
exports.todas = asyncHandler(async (_req, res) => res.json(await Citas.listarTodas()));
exports.cambiarEstado = asyncHandler(async (req, res) =>
  res.json(await Citas.cambiarEstado(req.params.id, (req.body || {}).estado)));
