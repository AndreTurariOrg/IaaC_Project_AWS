const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');


router.post('/login', usuarioController.login);
router.get('/verificar-sesion', usuarioController.verificarSesion);

module.exports = router;
