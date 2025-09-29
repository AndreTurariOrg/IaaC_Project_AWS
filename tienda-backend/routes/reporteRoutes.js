const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/ventas', reporteController.listarVentas);

module.exports = router;
