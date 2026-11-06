const Auth = require('../services/auth.service');
const { asyncHandler } = require('../middlewares/error');

exports.registro = asyncHandler(async (req, res) => res.status(201).json(await Auth.registrar(req.body)));
exports.login = asyncHandler(async (req, res) => res.json(await Auth.login(req.body)));
exports.me = (req, res) => res.json({ perfil: Auth.perfilPublico(req.user) });
