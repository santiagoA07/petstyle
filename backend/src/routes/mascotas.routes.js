const router = require('express').Router();
const c = require('../controllers/mascotas.controller');
const { requireAuth, requireRol } = require('../middlewares/auth');

// Solo el CLIENTE gestiona mascotas (y únicamente las suyas)
router.use(requireAuth, requireRol('CLIENTE'));
router.get('/', c.listar);
router.post('/', c.crear);
router.put('/:id', c.actualizar);
router.delete('/:id', c.eliminar);

module.exports = router;
