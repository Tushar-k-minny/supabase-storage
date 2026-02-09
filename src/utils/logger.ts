import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import pino, { type Logger } from "pino";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

/**
 * Production-ready Pino logger with:
 * - Structured JSON logging in production
 * - Pretty printing in development
 * - Sensitive field redaction
 * - Request ID support
 * - Child logger factory
 */
export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  // Redact sensitive fields from logs
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "token",
      "apiKey",
      "secret",
    ],
    censor: "[REDACTED]",
  },

  // Base context for all log entries
  base: {
    service: "learn-with-jiji",
    version: process.env.npm_package_version || "1.0.0",
  },

  // Format options
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty print in development only
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,service,version",
          messageFormat: "{msg}",
        },
      },
});

/**
 * Create a child logger with request context
 */
export const createRequestLogger = (requestId?: string): Logger => {
  return logger.child({
    requestId: requestId || randomUUID(),
  });
};

/**
 * Create a child logger for a specific module
 */
export const createModuleLogger = (moduleName: string): Logger => {
  return logger.child({ module: moduleName });
};

export default logger;
