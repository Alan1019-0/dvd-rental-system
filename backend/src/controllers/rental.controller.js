const { query, transaction } = require('../config/database');

/**
 * Crear nueva renta
 */
const createRental = async (req, res) => {
  try {
    const { customer_id, inventory_id, staff_id } = req.body;

    // Validar campos requeridos
    if (!customer_id || !inventory_id || !staff_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: customer_id, inventory_id, staff_id'
      });
    }

    // Verificar que el DVD no esté rentado
    const checkAvailability = await query(
      `SELECT r.rental_id, r.return_date 
       FROM rental r 
       WHERE r.inventory_id = $1 AND r.return_date IS NULL`,
      [inventory_id]
    );

    if (checkAvailability.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este DVD ya está rentado y no ha sido devuelto'
      });
    }

    // Crear la renta
    const rentalDate = new Date();
    const result = await query(
      `INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id, last_update)
       VALUES ($1, $2, $3, $4, $1)
       RETURNING *`,
      [rentalDate, inventory_id, customer_id, staff_id]
    );

    // Obtener información completa de la renta
    const rentalInfo = await query(
      `SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        c.first_name || ' ' || c.last_name as customer_name,
        f.title as film_title,
        s.first_name || ' ' || s.last_name as staff_name
       FROM rental r
       JOIN customer c ON r.customer_id = c.customer_id
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       JOIN staff s ON r.staff_id = s.staff_id
       WHERE r.rental_id = $1`,
      [result.rows[0].rental_id]
    );

    res.status(201).json({
      success: true,
      message: 'Renta creada exitosamente',
      data: rentalInfo.rows[0]
    });

  } catch (error) {
    console.error('Error al crear renta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la renta',
      error: error.message
    });
  }
};

/**
 * Obtener todas las rentas
 */
const getAllRentals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    if (status === 'active') {
      whereClause = 'WHERE r.return_date IS NULL';
    } else if (status === 'returned') {
      whereClause = 'WHERE r.return_date IS NOT NULL';
    }

    const result = await query(
      `SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        c.customer_id,
        c.first_name || ' ' || c.last_name as customer_name,
        f.film_id,
        f.title as film_title,
        s.staff_id,
        s.first_name || ' ' || s.last_name as staff_name,
        CASE 
          WHEN r.return_date IS NULL THEN 'Activa'
          ELSE 'Devuelta'
        END as status
       FROM rental r
       JOIN customer c ON r.customer_id = c.customer_id
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       JOIN staff s ON r.staff_id = s.staff_id
       ${whereClause}
       ORDER BY r.rental_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM rental r ${whereClause}`
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
    console.error('Error al obtener rentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las rentas',
      error: error.message
    });
  }
};

/**
 * Obtener renta por ID
 */
const getRentalById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        r.inventory_id,
        c.customer_id,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email as customer_email,
        f.film_id,
        f.title as film_title,
        f.description as film_description,
        f.rental_rate,
        s.staff_id,
        s.first_name || ' ' || s.last_name as staff_name
       FROM rental r
       JOIN customer c ON r.customer_id = c.customer_id
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       JOIN staff s ON r.staff_id = s.staff_id
       WHERE r.rental_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renta no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener renta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la renta',
      error: error.message
    });
  }
};

/**
 * Devolver DVD
 */
const returnRental = async (req, res) => {
  try {
    const { id } = req.params;
    const returnDate = new Date();

    // Verificar que la renta existe y no ha sido devuelta
    const checkRental = await query(
      'SELECT * FROM rental WHERE rental_id = $1',
      [id]
    );

    if (checkRental.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renta no encontrada'
      });
    }

    if (checkRental.rows[0].return_date !== null) {
      return res.status(400).json({
        success: false,
        message: 'Este DVD ya fue devuelto',
        return_date: checkRental.rows[0].return_date
      });
    }

    // Actualizar la fecha de devolución
    const result = await query(
      `UPDATE rental 
       SET return_date = $1, last_update = $1 
       WHERE rental_id = $2 
       RETURNING *`,
      [returnDate, id]
    );

    // Crear registro de pago si no existe
    const payment = await query(
      `INSERT INTO payment (customer_id, staff_id, rental_id, amount, payment_date)
       SELECT customer_id, staff_id, $1, 
              (SELECT rental_rate FROM film f 
               JOIN inventory i ON f.film_id = i.film_id 
               WHERE i.inventory_id = $2), 
              $3
       FROM rental WHERE rental_id = $1
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [id, checkRental.rows[0].inventory_id, returnDate]
    );

    res.json({
      success: true,
      message: 'DVD devuelto exitosamente',
      data: {
        rental_id: parseInt(id),
        return_date: returnDate,
        payment: payment.rows[0]
      }
    });

  } catch (error) {
    console.error('Error al devolver DVD:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la devolución',
      error: error.message
    });
  }
};

/**
 * Cancelar renta
 */
const cancelRental = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la renta existe
    const checkRental = await query(
      'SELECT * FROM rental WHERE rental_id = $1',
      [id]
    );

    if (checkRental.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renta no encontrada'
      });
    }

    // Usar transacción para eliminar renta y pagos asociados
    await transaction(async (client) => {
      // Eliminar pagos asociados
      await client.query(
        'DELETE FROM payment WHERE rental_id = $1',
        [id]
      );

      // Eliminar renta
      await client.query(
        'DELETE FROM rental WHERE rental_id = $1',
        [id]
      );
    });

    res.json({
      success: true,
      message: 'Renta cancelada exitosamente',
      data: {
        rental_id: parseInt(id),
        cancelled_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error al cancelar renta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la renta',
      error: error.message
    });
  }
};

/**
 * Obtener rentas por cliente
 */
const getRentalsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const result = await query(
      `SELECT 
        r.rental_id,
        r.rental_date,
        r.return_date,
        f.title as film_title,
        f.rental_rate,
        s.first_name || ' ' || s.last_name as staff_name,
        CASE 
          WHEN r.return_date IS NULL THEN 'Activa'
          ELSE 'Devuelta'
        END as status
       FROM rental r
       JOIN inventory i ON r.inventory_id = i.inventory_id
       JOIN film f ON i.film_id = f.film_id
       JOIN staff s ON r.staff_id = s.staff_id
       WHERE r.customer_id = $1
       ORDER BY r.rental_date DESC`,
      [customer_id]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener rentas del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las rentas del cliente',
      error: error.message
    });
  }
};

module.exports = {
  createRental,
  getAllRentals,
  getRentalById,
  returnRental,
  cancelRental,
  getRentalsByCustomer
};