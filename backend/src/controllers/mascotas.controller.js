const Mascotas = require('../services/mascotas.service');

exports.listar = (req, res) => res.json(Mascotas.listar(req.user));
exports.crear = (req, res) => res.status(201).json(Mascotas.crear(req.user, req.body));
exports.actualizar = (req, res) => res.json(Mascotas.actualizar(req.user, req.params.id, req.body));
exports.eliminar = (req, res) => { Mascotas.eliminar(req.user, req.params.id); res.json({ ok: true }); };
