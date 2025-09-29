const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/clientes', clienteController.getClientes);
router.get('/clientes-todos', clienteController.getTodosClientes);
router.put('/clientes/:id_cliente', clienteController.editarCliente);
router.delete('/clientes/:id_cliente', clienteController.deshabilitarCliente);
router.post('/clientes', clienteController.crearCliente);

module.exports = router;
