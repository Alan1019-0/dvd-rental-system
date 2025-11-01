const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rental.controller');

/**
 * @route   POST /api/rentals
 * @desc    Crear nueva renta
 * @access  Public
 */
router.post('/', rentalController.createRental);

/**
 * @route   GET /api/rentals
 * @desc    Obtener todas las rentas
 * @access  Public
 */
router.get('/', rentalController.getAllRentals);

/**
 * @route   GET /api/rentals/:id
 * @desc    Obtener renta por ID
 * @access  Public
 */
router.get('/:id', rentalController.getRentalById);

/**
 * @route   PUT /api/rentals/:id/return
 * @desc    Devolver DVD (marcar como devuelto)
 * @access  Public
 */
router.put('/:id/return', rentalController.returnRental);

/**
 * @route   DELETE /api/rentals/:id
 * @desc    Cancelar renta
 * @access  Public
 */
router.delete('/:id', rentalController.cancelRental);

/**
 * @route   GET /api/rentals/customer/:customer_id
 * @desc    Obtener rentas de un cliente específico
 * @access  Public
 */
router.get('/customer/:customer_id', rentalController.getRentalsByCustomer);

module.exports = router;