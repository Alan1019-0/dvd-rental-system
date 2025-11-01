const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

/**
 * @route   GET /api/customers
 * @desc    Obtener todos los clientes
 * @access  Public
 */
router.get('/', customerController.getAllCustomers);

/**
 * @route   GET /api/customers/:id
 * @desc    Obtener cliente por ID
 * @access  Public
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route   GET /api/customers/search/query
 * @desc    Buscar clientes
 * @access  Public
 */
router.get('/search/query', customerController.searchCustomers);

module.exports = router;