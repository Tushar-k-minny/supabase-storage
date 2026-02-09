import type { NextFunction, Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.js";
import { logger } from "../utils/logger.js";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  };
  res.status(404).json(response);
};

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(
    { message: err.message, stack: err.stack, name: err.name },
    "Error occurred"
  );

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const response: ApiResponse<null> = {
    success: false,
    error:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal server error"
        : err.message,
  };

  res.status(statusCode).json(response);
};
