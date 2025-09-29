const express = require('express');
const router = express.Router();
const fiadoController = require('../controllers/fiadoController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/fiados', fiadoController.listarFiados);
router.post('/fiado/pagar', fiadoController.marcarPagado);

module.exports = router;
