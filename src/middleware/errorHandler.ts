import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

// Centralized error handler. Never leaks internals (stack traces, driver
// messages, etc.) to the client - only a status + safe message.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Mongoose duplicate key (e.g. email already registered)
  if (typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ error: "Resource already exists" });
  }

  // Mongoose invalid ObjectId (e.g. malformed :id param) - treat as not found,
  // not a 500, and don't leak the driver's cast error message.
  if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "CastError") {
    return res.status(404).json({ error: "Not found" });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}
