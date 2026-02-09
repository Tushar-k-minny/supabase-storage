import type { NextFunction, Request, Response } from "express";
import { isSupabaseConfigured, supabase } from "../config/supabase.js";
import type { ApiResponse } from "../types/api-types.js";
import { logger } from "../utils/logger.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware that validates Supabase JWT tokens.
 *
 * Usage:
 * - Include Authorization header: "Bearer <supabase_jwt_token>"
 * - Token is validated against Supabase Auth
 * - User info is attached to req.user
 *
 * In mock mode (no Supabase configured), allows requests through
 * with a mock user for development purposes.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Check for Authorization header
    if (!authHeader?.startsWith("Bearer ")) {
      // In development without Supabase, allow mock authentication
      if (!isSupabaseConfigured) {
        logger.warn("Auth skipped: Supabase not configured, using mock user");
        req.user = {
          id: "mock-user-id",
          email: "mock@example.com",
          role: "authenticated",
        };
        next();
        return;
      }

      res.status(401).json({
        success: false,
        error: "Authorization header required. Use: Bearer <token>",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // If Supabase is not configured, validate token format only
    if (!(isSupabaseConfigured && supabase)) {
      logger.warn("Auth in mock mode: Supabase not configured");

      // Basic JWT format validation (mock mode)
      if (token.split(".").length !== 3) {
        res.status(401).json({
          success: false,
          error: "Invalid token format",
        });
        return;
      }

      req.user = {
        id: "mock-user-id",
        email: "mock@example.com",
        role: "authenticated",
      };
      next();
      return;
    }

    // Validate token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn({ error: error?.message }, "Token validation failed");
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || "",
      role: user.role || "authenticated",
    };

    logger.debug({ userId: user.id }, "User authenticated successfully");
    next();
  } catch (error) {
    logger.error({ error: String(error) }, "Authentication error");
    res.status(500).json({
      success: false,
      error: "Authentication service unavailable",
    });
  }
};
