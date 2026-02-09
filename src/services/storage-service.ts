import { isSupabaseConfigured, supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

const STORAGE_BUCKET = "learning-materials";

export interface StorageFile {
  name: string;
  path: string;
  url: string;
  size: number;
  type: "ppt" | "video" | "other";
  createdAt: string;
}

/**
 * Get the public URL for a file in Supabase Storage
 */
export const getPublicUrl = (path: string): string => {
  if (!(isSupabaseConfigured && supabase)) {
    logger.warn("Supabase not configured, returning placeholder URL");
    return `https://placeholder.storage/${path}`;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * List all files in the storage bucket
 */
export const listStorageFiles = async (
  folder?: string
): Promise<StorageFile[]> => {
  if (!(isSupabaseConfigured && supabase)) {
    logger.warn("Supabase not configured, returning sample files");
    return getSampleFiles();
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder || "", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      logger.error({ error: String(error) }, "Error listing storage files");
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter((file) => file.name !== ".emptyFolderPlaceholder")
      .map((file) => {
        const path = folder ? `${folder}/${file.name}` : file.name;
        return {
          name: file.name,
          path,
          url: getPublicUrl(path),
          size: file.metadata?.size || 0,
          type: getFileType(file.name),
          createdAt: file.created_at || new Date().toISOString(),
        };
      });
  } catch (error) {
    logger.error({ error: String(error) }, "Unexpected error listing files");
    return [];
  }
};

/**
 * Get files by type (presentations or videos)
 */
export const getFilesByType = async (
  type: "ppt" | "video"
): Promise<StorageFile[]> => {
  const folder = type === "ppt" ? "presentations" : "videos";
  return await listStorageFiles(folder);
};

/**
 * Check if a file exists in storage
 */
export const fileExists = async (path: string): Promise<boolean> => {
  if (!(isSupabaseConfigured && supabase)) {
    return false;
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop(),
      });

    return !error && data && data.length > 0;
  } catch {
    return false;
  }
};

/**
 * Generate a signed URL for private file access
 */
export const getSignedUrl = async (
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> => {
  if (!(isSupabaseConfigured && supabase)) {
    logger.warn("Supabase not configured, cannot generate signed URL");
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      logger.error({ error: String(error) }, "Error creating signed URL");
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    logger.error(
      { error: String(error) },
      "Unexpected error creating signed URL"
    );
    return null;
  }
};

/**
 * Determine file type from extension
 */
const getFileType = (filename: string): "ppt" | "video" | "other" => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext && ["ppt", "pptx", "odp"].includes(ext)) {
    return "ppt";
  }

  if (ext && ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return "video";
  }

  return "other";
};

/**
 * Sample files for development/mock mode
 */
const getSampleFiles = (): StorageFile[] => [
  {
    name: "rag-intro.pptx",
    path: "presentations/rag-intro.pptx",
    url: "https://placeholder.storage/presentations/rag-intro.pptx",
    size: 2_048_000,
    type: "ppt",
    createdAt: new Date().toISOString(),
  },
  {
    name: "ml-fundamentals.pptx",
    path: "presentations/ml-fundamentals.pptx",
    url: "https://placeholder.storage/presentations/ml-fundamentals.pptx",
    size: 3_072_000,
    type: "ppt",
    createdAt: new Date().toISOString(),
  },
  {
    name: "rag-tutorial.mp4",
    path: "videos/rag-tutorial.mp4",
    url: "https://placeholder.storage/videos/rag-tutorial.mp4",
    size: 50_000_000,
    type: "video",
    createdAt: new Date().toISOString(),
  },
  {
    name: "neural-networks.mp4",
    path: "videos/neural-networks.mp4",
    url: "https://placeholder.storage/videos/neural-networks.mp4",
    size: 75_000_000,
    type: "video",
    createdAt: new Date().toISOString(),
  },
];
