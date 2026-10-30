const router = require('express').Router();
const c = require('../controllers/citas.controller');
const { requireAuth, requireRol } = require('../middlewares/auth');

router.use(requireAuth);

// --- Vista CLIENTE ---
router.post('/', requireRol('CLIENTE'), c.crear);
router.get('/mias', requireRol('CLIENTE'), c.misCitas);
router.patch('/:id/cancelar', requireRol('CLIENTE'), c.cancelar);

// --- Vista ADMINISTRADOR ---
router.get('/', requireRol('ADMINISTRADOR'), c.todas);
router.patch('/:id/estado', requireRol('ADMINISTRADOR'), c.cambiarEstado);

module.exports = router;
