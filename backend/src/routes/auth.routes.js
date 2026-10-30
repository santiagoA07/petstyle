const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');

router.post('/registro', c.registro);   // público: crea CLIENTE
router.post('/login', c.login);         // público: { email, password, rol }
router.get('/me', requireAuth, c.me);   // cualquier usuario autenticado

module.exports = router;
