const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

/**
 * @route   GET /api/reports/customer/:customer_id/rentals
 * @desc    Lista de todas las rentas de un cliente
 * @access  Public
 */
router.get('/customer/:customer_id/rentals', reportController.getCustomerRentals);

/**
 * @route   GET /api/reports/unreturned
 * @desc    Identificar los DVDs que no se han devuelto
 * @access  Public
 */
router.get('/unreturned', reportController.getUnreturnedDVDs);

/**
 * @route   GET /api/reports/top-films
 * @desc    Determinar los DVDs más rentados
 * @access  Public
 */
router.get('/top-films', reportController.getTopRentedFilms);

/**
 * @route   GET /api/reports/staff-earnings
 * @desc    Calcular el total de ganancia generada por cada miembro del staff
 * @access  Public
 */
router.get('/staff-earnings', reportController.getStaffEarnings);

/**
 * @route   GET /api/reports/summary
 * @desc    Resumen general del sistema
 * @access  Public
 */
router.get('/summary', reportController.getSystemSummary);

module.exports = router;