const { query } = require('../config/database');

/**
 * Obtener todos los clientes
 */
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (active !== undefined) {
      whereClause = 'WHERE c.active = $3';
      params = [limit, offset, active === 'true' ? 1 : 0];
    } else {
      params = [limit, offset];
    }

    const result = await query(
      `SELECT 
        c.customer_id,
        c.first_name || ' ' || c.last_name as name,
        c.email,
        c.active,
        c.create_date,
        a.address,
        ci.city,
        co.country,
        COUNT(DISTINCT r.rental_id) as total_rentals,
        COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.rental_id END) as active_rentals
       FROM customer c
       JOIN address a ON c.address_id = a.address_id
       JOIN city ci ON a.city_id = ci.city_id
       JOIN country co ON ci.country_id = co.country_id
       LEFT JOIN rental r ON c.customer_id = r.customer_id
       ${whereClause}
       GROUP BY c.customer_id, a.address, ci.city, co.country
       ORDER BY c.last_name, c.first_name
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM customer c ${whereClause}`,
      active !== undefined ? [active === 'true' ? 1 : 0] : []
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
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los clientes',
      error: error.message
    });
  }
};

/**
 * Obtener cliente por ID
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.active,
        c.create_date,
        a.address,
        a.phone,
        ci.city,
        co.country,
        s.store_id,
        COUNT(DISTINCT r.rental_id) as total_rentals,
        COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.rental_id END) as active_rentals,
        COALESCE(SUM(p.amount), 0) as total_spent
       FROM customer c
       JOIN address a ON c.address_id = a.address_id
       JOIN city ci ON a.city_id = ci.city_id
       JOIN country co ON ci.country_id = co.country_id
       JOIN store s ON c.store_id = s.store_id
       LEFT JOIN rental r ON c.customer_id = r.customer_id
       LEFT JOIN payment p ON r.rental_id = p.rental_id
       WHERE c.customer_id = $1
       GROUP BY c.customer_id, a.address, a.phone, ci.city, co.country, s.store_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el cliente',
      error: error.message
    });
  }
};

/**
 * Buscar clientes
 */
const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda "q" es requerido'
      });
    }

    const result = await query(
      `SELECT 
        c.customer_id,
        c.first_name || ' ' || c.last_name as name,
        c.email,
        c.active,
        a.address,
        ci.city,
        co.country
       FROM customer c
       JOIN address a ON c.address_id = a.address_id
       JOIN city ci ON a.city_id = ci.city_id
       JOIN country co ON ci.country_id = co.country_id
       WHERE 
        c.first_name ILIKE $1 OR 
        c.last_name ILIKE $1 OR 
        c.email ILIKE $1
       ORDER BY c.last_name, c.first_name
       LIMIT 50`,
      [`%${q}%`]
    );

    res.json({
      success: true,
      query: q,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar clientes',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  searchCustomers
};