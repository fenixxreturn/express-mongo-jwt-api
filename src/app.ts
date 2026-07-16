import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import itemsRoutes from "./routes/items.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : false,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/auth", authRoutes);
  app.use("/items", itemsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
