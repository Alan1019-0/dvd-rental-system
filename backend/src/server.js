require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const rentalRoutes = require("./routes/rental.routes");
const reportRoutes = require("./routes/report.routes");
const filmRoutes = require("./routes/film.routes");
const customerRoutes = require("./routes/customer.routes");

const app = express();
const port = process.env.PORT ?? 3000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan("dev"));

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Rutas API
app.use("/api/rentals", rentalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/films", filmRoutes);
app.use("/api/customers", customerRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ API escuchando en puerto ${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT recibido, cerrando servidor...");
  process.exit(0);
});

module.exports = app;
