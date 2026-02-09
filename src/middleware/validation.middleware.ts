import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema, z } from "zod";
import type { ApiResponse } from "../types/api-types.js";

/**
 * Validation error details for better client debugging
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/**
 * Create a body validation middleware for any Zod schema
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ValidationErrorDetail[] = error.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
          code: issue.code,
        }));

        const response: ApiResponse<null> & {
          details?: ValidationErrorDetail[];
        } = {
          success: false,
          error: `Validation failed: ${details.map((d) => `${d.field}: ${d.message}`).join(", ")}`,
          details,
        };

        res.status(400).json(response);
        return;
      }

      next(error);
    }
  };
};

/**
 * Create a query params validation middleware
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ValidationErrorDetail[] = error.issues.map((issue) => ({
          field: issue.path.join(".") || "query",
          message: issue.message,
          code: issue.code,
        }));

        const response: ApiResponse<null> & {
          details?: ValidationErrorDetail[];
        } = {
          success: false,
          error: `Query validation failed: ${details.map((d) => `${d.field}: ${d.message}`).join(", ")}`,
          details,
        };

        res.status(400).json(response);
        return;
      }

      next(error);
    }
  };
};

/**
 * Create a URL params validation middleware
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ValidationErrorDetail[] = error.issues.map((issue) => ({
          field: issue.path.join(".") || "params",
          message: issue.message,
          code: issue.code,
        }));

        const response: ApiResponse<null> & {
          details?: ValidationErrorDetail[];
        } = {
          success: false,
          error: `Params validation failed: ${details.map((d) => `${d.field}: ${d.message}`).join(", ")}`,
          details,
        };

        res.status(400).json(response);
        return;
      }

      next(error);
    }
  };
};

// ===========================================
// Schemas
// ===========================================

/**
 * Ask Jiji request schema with enhanced validation
 */
export const askJijiSchema = z.object({
  query: z
    .string({ error: "Query must be a string" })
    .min(1, "Query cannot be empty")
    .max(1000, "Query cannot exceed 1000 characters")
    .trim()
    .refine((val) => val.length > 0, "Query cannot be only whitespace"),
});

export type AskJijiInput = z.infer<typeof askJijiSchema>;

/**
 * Pagination query schema (reusable)
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * UUID param schema (reusable)
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
