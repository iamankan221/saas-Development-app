import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { requestLogger, errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/index.js";

BigInt.prototype.toJSON = function () {
  // We convert to a standard Number. 
  // Since you are tracking paise, JS Numbers can safely handle up to ₹90,000 Crores.
  return Number(this); 
};

// Routes
import customerRoutes from "./routes/customerRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ============================================================================
// API ROUTES
// ============================================================================

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Customers Routes
app.use("/api/customers", customerRoutes);

// Bills Routes
app.use("/api/bills", billRoutes);

// Inventory Routes
app.use("/api/inventory", inventoryRoutes);

// Suppliers Routes
app.use("/api/suppliers", supplierRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📦 Environment: ${config.nodeEnv}`);
  logger.info(`🗄️  Database URL configured: ${config.database.url.substring(0, 50)}...`);
});