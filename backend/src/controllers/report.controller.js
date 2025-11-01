const { query } = require('../config/database');

/**
 * REPORTE 1: Lista de todas las rentas de un cliente
 */
const getCustomerRentals = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { status, sort = 'desc' } = req.query;

    let whereClause = 'WHERE r.customer_id = $1';
    if (status === 'active') {
      whereClause += ' AND r.return_date IS NULL';
    } else if (status === 'returned') {
      whereClause += ' AND r.return_date IS NOT NULL';
    }

    const orderBy = sort === 'asc' ? 'ASC' : 'DESC';

    // Obtener información del cliente
    const customerInfo = await query(
      `SELECT 
        customer_id,
        first_name || ' ' || last_name as name,
        email,
        active
       FROM customer WHERE customer_id = $1`,
      [customer_id]
    );

    if (customerInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener rentas del cliente
    const rentals = await query(
      `SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        f.film_id,
        f.title as film_title,
        f.rental_rate,
        c.name as category,
        s.first_name || ' ' || s.last_name as staff_name,
        st.store_id,
        p.amount as payment_amount,
        p.payment_date,
        CASE 
          WHEN r.return_date IS NULL THEN 'Activa'
          WHEN r.return_date IS NOT NULL THEN 'Devuelta'
        END as status,
        CASE 
          WHEN r.return_date IS NULL THEN 
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - r.rental_date))
          ELSE 
            EXTRACT(DAY FROM (r.return_date - r.rental_date))
        END as rental_days
       FROM rental r
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       JOIN film_category fc ON f.film_id = fc.film_id
       JOIN category c ON fc.category_id = c.category_id
       JOIN staff s ON r.staff_id = s.staff_id
       JOIN store st ON i.store_id = st.store_id
       LEFT JOIN payment p ON r.rental_id = p.rental_id
       ${whereClause}
       ORDER BY r.rental_date ${orderBy}`,
      [customer_id]
    );

    // Calcular estadísticas
    const stats = await query(
      `SELECT 
        COUNT(*) as total_rentals,
        COUNT(CASE WHEN return_date IS NULL THEN 1 END) as active_rentals,
        COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as returned_rentals,
        COALESCE(SUM(p.amount), 0) as total_spent
       FROM rental r
       LEFT JOIN payment p ON r.rental_id = p.rental_id
       WHERE r.customer_id = $1`,
      [customer_id]
    );

    res.json({
      success: true,
      customer: customerInfo.rows[0],
      statistics: stats.rows[0],
      rentals: rentals.rows,
      total: rentals.rows.length
    });

  } catch (error) {
    console.error('Error al obtener rentas del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte',
      error: error.message
    });
  }
};

/**
 * REPORTE 2: DVDs que no se han devuelto
 */
const getUnreturnedDVDs = async (req, res) => {
  try {
    const { days_overdue, sort_by = 'days' } = req.query;

    let havingClause = '';
    if (days_overdue) {
      havingClause = `HAVING EXTRACT(DAY FROM (CURRENT_TIMESTAMP - r.rental_date)) >= ${days_overdue}`;
    }

    const sortColumn = sort_by === 'customer' ? 'customer_name' : 'days_overdue';

    const result = await query(
      `SELECT 
        r.rental_id,
        r.rental_date,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - r.rental_date))::INTEGER as days_overdue,
        c.customer_id,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        f.film_id,
        f.title as film_title,
        f.rental_rate,
        cat.name as category,
        s.first_name || ' ' || s.last_name as staff_name,
        st.store_id,
        a.address || ', ' || ci.city || ', ' || co.country as customer_address,
        CASE 
          WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - r.rental_date)) > 7 THEN 'Atrasado'
          WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - r.rental_date)) > 3 THEN 'Próximo a vencer'
          ELSE 'Normal'
        END as urgency_status
       FROM rental r
       JOIN customer c ON r.customer_id = c.customer_id
       JOIN address a ON c.address_id = a.address_id
       JOIN city ci ON a.city_id = ci.city_id
       JOIN country co ON ci.country_id = co.country_id
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       JOIN film_category fc ON f.film_id = fc.film_id
       JOIN category cat ON fc.category_id = cat.category_id
       JOIN staff s ON r.staff_id = s.staff_id
       JOIN store st ON i.store_id = st.store_id
       WHERE r.return_date IS NULL
       ${havingClause}
       ORDER BY ${sortColumn} DESC`,
      []
    );

    // Estadísticas
    const stats = await query(
      `SELECT 
        COUNT(*) as total_unreturned,
        COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - rental_date)) > 7 THEN 1 END) as overdue,
        COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - rental_date)) BETWEEN 4 AND 7 THEN 1 END) as near_overdue,
        COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - rental_date)) <= 3 THEN 1 END) as on_time,
        AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - rental_date)))::NUMERIC(10,2) as avg_days_out
       FROM rental
       WHERE return_date IS NULL`,
      []
    );

    res.json({
      success: true,
      statistics: stats.rows[0],
      unreturned_dvds: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener DVDs no devueltos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte',
      error: error.message
    });
  }
};

/**
 * REPORTE 3: DVDs más rentados
 */
const getTopRentedFilms = async (req, res) => {
  try {
    const { limit = 10, category, min_rentals } = req.query;

    let whereClause = '';
    let havingClause = '';

    if (category) {
      whereClause = `WHERE c.name = '${category}'`;
    }

    if (min_rentals) {
      havingClause = `HAVING COUNT(r.rental_id) >= ${min_rentals}`;
    }

    const result = await query(
      `SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_rate,
        f.length as duration_minutes,
        f.rating,
        c.name as category,
        COUNT(r.rental_id) as total_rentals,
        COUNT(CASE WHEN r.return_date IS NULL THEN 1 END) as currently_rented,
        COUNT(CASE WHEN r.return_date IS NOT NULL THEN 1 END) as returned_rentals,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        ROUND(AVG(EXTRACT(DAY FROM (COALESCE(r.return_date, CURRENT_TIMESTAMP) - r.rental_date)))::NUMERIC, 2) as avg_rental_days,
        COUNT(DISTINCT r.customer_id) as unique_customers
       FROM film f
       JOIN film_category fc ON f.film_id = fc.film_id
       JOIN category c ON fc.category_id = c.category_id
       JOIN inventory i ON f.film_id = i.film_id
       JOIN rental r ON i.inventory_id = r.inventory_id
       LEFT JOIN payment p ON r.rental_id = p.rental_id
       ${whereClause}
       GROUP BY f.film_id, f.title, f.description, f.release_year, 
                f.rental_rate, f.length, f.rating, c.name
       ${havingClause}
       ORDER BY total_rentals DESC, total_revenue DESC
       LIMIT $1`,
      [limit]
    );

    // Estadísticas generales
    const stats = await query(
      `SELECT 
        COUNT(DISTINCT f.film_id) as total_films,
        COUNT(r.rental_id) as total_rentals,
        COALESCE(SUM(p.amount), 0) as total_system_revenue,
        ROUND(AVG(rental_count), 2) as avg_rentals_per_film
       FROM film f
       LEFT JOIN inventory i ON f.film_id = i.film_id
       LEFT JOIN rental r ON i.inventory_id = r.inventory_id
       LEFT JOIN payment p ON r.rental_id = p.rental_id
       CROSS JOIN (
         SELECT AVG(cnt) as rental_count
         FROM (
           SELECT COUNT(*) as cnt
           FROM rental
           GROUP BY inventory_id
         ) sub
       ) avg_calc`,
      []
    );

    res.json({
      success: true,
      statistics: stats.rows[0],
      top_films: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener películas más rentadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte',
      error: error.message
    });
  }
};

/**
 * REPORTE 4: Ganancias por empleado del staff
 */
const getStaffEarnings = async (req, res) => {
  try {
    const { start_date, end_date, store_id } = req.query;

    let dateFilter = '';
    let params = [];
    let paramCounter = 1;

    if (start_date && end_date) {
      dateFilter = `AND p.payment_date BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
      params.push(start_date, end_date);
      paramCounter += 2;
    }

    let storeFilter = '';
    if (store_id) {
      storeFilter = `AND s.store_id = $${paramCounter}`;
      params.push(store_id);
    }

    const result = await query(
      `SELECT 
        s.staff_id,
        s.first_name || ' ' || s.last_name as staff_name,
        s.email as staff_email,
        s.active,
        st.store_id,
        a.address || ', ' || c.city as store_location,
        COUNT(DISTINCT r.rental_id) as total_rentals_processed,
        COUNT(DISTINCT r.customer_id) as unique_customers_served,
        COALESCE(SUM(p.amount), 0) as total_earnings,
        ROUND(AVG(p.amount)::NUMERIC, 2) as avg_payment,
        MIN(p.payment_date) as first_transaction,
        MAX(p.payment_date) as last_transaction,
        COUNT(CASE WHEN r.return_date IS NULL THEN 1 END) as active_rentals,
        COUNT(CASE WHEN r.return_date IS NOT NULL THEN 1 END) as completed_rentals,
        ROUND(
          COALESCE(SUM(p.amount), 0) / 
          NULLIF(COUNT(DISTINCT r.rental_id), 0)::NUMERIC, 
        2) as earnings_per_rental
       FROM staff s
       JOIN store st ON s.store_id = st.store_id
       JOIN address a ON st.address_id = a.address_id
       JOIN city c ON a.city_id = c.city_id
       LEFT JOIN rental r ON s.staff_id = r.staff_id ${dateFilter.replace('p.payment_date', 'r.rental_date')}
       LEFT JOIN payment p ON r.rental_id = p.rental_id ${dateFilter}
       WHERE 1=1 ${storeFilter}
       GROUP BY s.staff_id, s.first_name, s.last_name, s.email, 
                s.active, st.store_id, a.address, c.city
       ORDER BY total_earnings DESC`,
      params
    );

    // Estadísticas generales
    const totalStats = await query(
      `SELECT 
        SUM(total_earnings) as total_system_earnings,
        AVG(total_earnings) as avg_earnings_per_staff,
        MAX(total_earnings) as highest_earnings,
        MIN(total_earnings) as lowest_earnings
       FROM (
         SELECT COALESCE(SUM(p.amount), 0) as total_earnings
         FROM staff s
         LEFT JOIN rental r ON s.staff_id = r.staff_id
         LEFT JOIN payment p ON r.rental_id = p.rental_id
         ${dateFilter}
         GROUP BY s.staff_id
       ) earnings`,
      start_date && end_date ? [start_date, end_date] : []
    );

    res.json({
      success: true,
      statistics: totalStats.rows[0],
      staff_earnings: result.rows,
      total_staff: result.rows.length,
      filters: {
        start_date: start_date || 'all',
        end_date: end_date || 'all',
        store_id: store_id || 'all'
      }
    });

  } catch (error) {
    console.error('Error al obtener ganancias del staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte',
      error: error.message
    });
  }
};

/**
 * REPORTE ADICIONAL: Resumen general del sistema
 */
const getSystemSummary = async (req, res) => {
  try {
    const summary = await query(
      `SELECT 
        (SELECT COUNT(*) FROM customer WHERE active = 1) as active_customers,
        (SELECT COUNT(*) FROM film) as total_films,
        (SELECT COUNT(*) FROM inventory) as total_inventory,
        (SELECT COUNT(*) FROM rental WHERE return_date IS NULL) as active_rentals,
        (SELECT COUNT(*) FROM rental WHERE return_date IS NOT NULL) as completed_rentals,
        (SELECT COUNT(*) FROM rental) as total_rentals,
        (SELECT COALESCE(SUM(amount), 0) FROM payment) as total_revenue,
        (SELECT COUNT(*) FROM staff WHERE active = true) as active_staff,
        (SELECT COUNT(*) FROM store) as total_stores`,
      []
    );

    // Top categorías
    const topCategories = await query(
      `SELECT 
        c.name as category,
        COUNT(r.rental_id) as rentals
       FROM category c
       JOIN film_category fc ON c.category_id = fc.category_id
       JOIN film f ON fc.film_id = f.film_id
       JOIN inventory i ON f.film_id = i.film_id
       JOIN rental r ON i.inventory_id = r.inventory_id
       GROUP BY c.name
       ORDER BY rentals DESC
       LIMIT 5`,
      []
    );

    // Actividad reciente
    const recentActivity = await query(
      `SELECT 
        'rental' as type,
        rental_date as date,
        'Nueva renta: ' || f.title as description
       FROM rental r
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       ORDER BY rental_date DESC
       LIMIT 10`,
      []
    );

    res.json({
      success: true,
      summary: summary.rows[0],
      top_categories: topCategories.rows,
      recent_activity: recentActivity.rows
    });

  } catch (error) {
    console.error('Error al obtener resumen del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen',
      error: error.message
    });
  }
};

module.exports = {
  getCustomerRentals,
  getUnreturnedDVDs,
  getTopRentedFilms,
  getStaffEarnings,
  getSystemSummary
};