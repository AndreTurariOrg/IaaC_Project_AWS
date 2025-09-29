const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/productos', productoController.getProductos);
router.post('/productos', productoController.crearProducto);
router.put('/productos/:id_producto', productoController.editarProducto);
router.delete('/productos/:id_producto', productoController.deshabilitarProducto);

module.exports = router;
