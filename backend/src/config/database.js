require("dotenv").config();
const { Pool } = require("pg");

// Crear pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Probar conexión al iniciar
pool.connect()
  .then(() => console.log("✅ Conexión a PostgreSQL exitosa"))
  .catch(err => console.error("❌ Error al conectar a PostgreSQL:", err));

// Helpers
const query = (text, params) => pool.query(text, params);

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const testConnection = async () => {
  try {
    await pool.query("SELECT NOW()");
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
