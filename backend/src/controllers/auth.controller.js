const Auth = require('../services/auth.service');

exports.registro = (req, res) => res.status(201).json(Auth.registrar(req.body));
exports.login = (req, res) => res.json(Auth.login(req.body));
exports.me = (req, res) => res.json({ perfil: Auth.perfilPublico(req.user) });
