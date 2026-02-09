import cors from "cors";
import dotenv from "dotenv";
import express, { type Express } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.middleware.js";
import askJijiRoutes from "./routes/ask-jiji.routes.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info({ query: req.query, ip: req.ip }, `${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
    },
  });
});

app.use("/ask-jiji", askJijiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, environment: NODE_ENV, timestamp: new Date().toISOString() },
    "🚀 Server started successfully"
  );

  console.log(`
  🧠 Learn with Jiji Backend
  
  Server:      http://localhost:${PORT}
  Environment: ${NODE_ENV}
  
  Routes:
    GET  /health    → Health check
    POST /ask-jiji  → Ask Jiji a question
  `);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export default app;
