const { query } = require('../config/database');

/**
 * Obtener todas las películas
 */
const getAllFilms = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, rating, available } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    if (category) {
      whereConditions.push(`c.name = $${paramCounter}`);
      params.push(category);
      paramCounter++;
    }

    if (rating) {
      whereConditions.push(`f.rating = $${paramCounter}`);
      params.push(rating);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    let query_text = `
      SELECT DISTINCT
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_rate,
        f.length as duration_minutes,
        f.rating,
        c.name as category,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE 
          WHEN r.return_date IS NULL THEN NULL 
          ELSE i.inventory_id 
        END) as available_copies
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN inventory i ON f.film_id = i.film_id
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
      ${whereClause}
      GROUP BY f.film_id, f.title, f.description, f.release_year, 
               f.rental_rate, f.length, f.rating, c.name
    `;

    if (available === 'true') {
      query_text += ' HAVING COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN NULL ELSE i.inventory_id END) > 0';
    }

    query_text += ` ORDER BY f.title LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    params.push(limit, offset);

    const result = await require('../config/database').query(query_text, params);

    // Count total
    let countQuery = `
      SELECT COUNT(DISTINCT f.film_id)
      FROM film f
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      ${whereClause}
    `;
    const countResult = await require('../config/database').query(
      countQuery, 
      params.slice(0, paramCounter - 1)
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las películas',
      error: error.message
    });
  }
};

/**
 * Obtener película por ID
 */
const getFilmById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_rate,
        f.length as duration_minutes,
        f.rating,
        f.special_features,
        c.name as category,
        l.name as language,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE WHEN r.return_date IS NOT NULL OR r.rental_id IS NULL THEN i.inventory_id END) as available_copies,
        COUNT(DISTINCT r.rental_id) as times_rented
       FROM film f
       JOIN film_category fc ON f.film_id = fc.film_id
       JOIN category c ON fc.category_id = c.category_id
       JOIN language l ON f.language_id = l.language_id
       LEFT JOIN inventory i ON f.film_id = i.film_id
       LEFT JOIN rental r ON i.inventory_id = r.inventory_id
       WHERE f.film_id = $1
       GROUP BY f.film_id, c.name, l.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener película:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la película',
      error: error.message
    });
  }
};

/**
 * Buscar películas
 */
const searchFilms = async (req, res) => {
  try {
    const { q, category, rating } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda "q" es requerido'
      });
    }

    let whereConditions = [`(f.title ILIKE $1 OR f.description ILIKE $1)`];
    let params = [`%${q}%`];
    let paramCounter = 2;

    if (category) {
      whereConditions.push(`c.name = $${paramCounter}`);
      params.push(category);
      paramCounter++;
    }

    if (rating) {
      whereConditions.push(`f.rating = $${paramCounter}`);
      params.push(rating);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const result = await query(
      `SELECT DISTINCT
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_rate,
        f.length as duration_minutes,
        f.rating,
        c.name as category,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE WHEN r.return_date IS NOT NULL OR r.rental_id IS NULL THEN i.inventory_id END) as available_copies
       FROM film f
       JOIN film_category fc ON f.film_id = fc.film_id
       JOIN category c ON fc.category_id = c.category_id
       LEFT JOIN inventory i ON f.film_id = i.film_id
       LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
       ${whereClause}
       GROUP BY f.film_id, c.name
       ORDER BY f.title
       LIMIT 50`,
      params
    );

    res.json({
      success: true,
      query: q,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al buscar películas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar películas',
      error: error.message
    });
  }
};

/**
 * Obtener películas disponibles
 */
const getAvailableFilms = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await query(
      `SELECT DISTINCT
        f.film_id,
        f.title,
        f.description,
        f.rental_rate,
        f.rating,
        c.name as category,
        COUNT(DISTINCT CASE 
          WHEN r.return_date IS NOT NULL OR r.rental_id IS NULL THEN i.inventory_id 
        END) as available_copies
       FROM film f
       JOIN film_category fc ON f.film_id = fc.film_id
       JOIN category c ON fc.category_id = c.category_id
       JOIN inventory i ON f.film_id = i.film_id
       LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
       GROUP BY f.film_id, c.name
       HAVING COUNT(DISTINCT CASE 
         WHEN r.return_date IS NOT NULL OR r.rental_id IS NULL THEN i.inventory_id 
       END) > 0
       ORDER BY f.title
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener películas disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener películas disponibles',
      error: error.message
    });
  }
};

/**
 * Obtener categorías
 */
const getCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        c.category_id,
        c.name,
        COUNT(DISTINCT f.film_id) as film_count
       FROM category c
       LEFT JOIN film_category fc ON c.category_id = fc.category_id
       LEFT JOIN film f ON fc.film_id = f.film_id
       GROUP BY c.category_id, c.name
       ORDER BY c.name`,
      []
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías',
      error: error.message
    });
  }
};

module.exports = {
  getAllFilms,
  getFilmById,
  searchFilms,
  getAvailableFilms,
  getCategories
};