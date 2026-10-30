const Citas = require('../services/citas.service');

exports.crear = (req, res) => res.status(201).json(Citas.crear(req.user, req.body));
exports.misCitas = (req, res) => res.json(Citas.listarDeUsuario(req.user));
exports.cancelar = (req, res) => res.json(Citas.cancelar(req.user, req.params.id));
exports.todas = (_req, res) => res.json(Citas.listarTodas());
exports.cambiarEstado = (req, res) => res.json(Citas.cambiarEstado(req.params.id, (req.body || {}).estado));
