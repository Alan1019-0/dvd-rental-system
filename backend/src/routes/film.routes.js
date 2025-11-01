const express = require('express');
const router = express.Router();
const filmController = require('../controllers/film.controller');

/**
 * @route   GET /api/films
 * @desc    Obtener todas las películas
 * @access  Public
 */
router.get('/', filmController.getAllFilms);

/**
 * @route   GET /api/films/:id
 * @desc    Obtener película por ID
 * @access  Public
 */
router.get('/:id', filmController.getFilmById);

/**
 * @route   GET /api/films/search
 * @desc    Buscar películas
 * @access  Public
 */
router.get('/search/query', filmController.searchFilms);

/**
 * @route   GET /api/films/available
 * @desc    Obtener películas disponibles para rentar
 * @access  Public
 */
router.get('/available/list', filmController.getAvailableFilms);

/**
 * @route   GET /api/films/categories/list
 * @desc    Obtener todas las categorías
 * @access  Public
 */
router.get('/categories/list', filmController.getCategories);

module.exports = router;