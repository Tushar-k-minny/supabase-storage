import { isSupabaseAdminConfigured, isSupabaseConfigured, supabase, supabaseAdmin } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

export interface SavedQuery {
  id: string;
  user_id: string | null;
  query_text: string;
  answer_text: string | null;
  resources_returned: string[];
  created_at: string;
}

/**
 * Save a user query to the queries table
 */
export const saveQuery = async (
  userId: string | null,
  queryText: string,
  answerText: string,
  resourceIds: string[]
): Promise<SavedQuery | null> => {
  if (!(isSupabaseAdminConfigured && supabaseAdmin)) {
    logger.warn("Supabase admin not configured, skipping query save");
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("queries")
      .insert({
        user_id: userId,
        query_text: queryText,
        answer_text: answerText,
        resources_returned: resourceIds,
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, "Failed to save query");
      return null;
    }

    logger.info({ queryId: data?.id }, "Query saved successfully");
    return data as SavedQuery;
  } catch (error) {
    logger.error({ error: String(error) }, "Unexpected error saving query");
    return null;
  }
};

/**
 * Get query history for a user
 */
export const getUserQueries = async (
  userId: string,
  limit = 20
): Promise<SavedQuery[]> => {
  if (!(isSupabaseConfigured && supabase)) {
    logger.warn("Supabase not configured, returning empty history");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("queries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error({ error: String(error) }, "Failed to fetch user queries");
      return [];
    }

    return (data as SavedQuery[]) || [];
  } catch (error) {
    logger.error({ error: String(error) }, "Unexpected error fetching queries");
    return [];
  }
};
