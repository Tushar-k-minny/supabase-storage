import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { AskJijiInput } from "../middleware/validation.middleware.js";
import { saveQuery } from "../services/query-service.js";
import {
  generateMockAnswer,
  searchResources,
} from "../services/resource-service.js";
import type { ApiResponse, AskJijiData } from "../types/api-types.js";
import { logger } from "../utils/logger.js";

export const handleAskJiji = async (
  req: AuthenticatedRequest & { body: AskJijiInput },
  res: Response<ApiResponse<AskJijiData>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = req.body;
    const userId = req.user?.id || null;

    logger.info({ query, userId }, "Processing ask-jiji request");

    const answer = generateMockAnswer(query);
    const resources = await searchResources(query);

    // Save query to database (non-blocking)
    const resourceIds = resources.map((r) => r.id);
    saveQuery(userId, query, answer, resourceIds).catch((err) => {
      logger.error({ error: String(err) }, "Background query save failed");
    });

    logger.info(
      { query, userId, resourceCount: resources.length },
      "Ask-jiji request completed"
    );

    const response: ApiResponse<AskJijiData> = {
      success: true,
      data: {
        answer,
        resources,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
