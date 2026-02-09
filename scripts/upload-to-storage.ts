import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET_NAME = "learning-materials";

if (!(SUPABASE_URL && SUPABASE_SERVICE_KEY)) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.log("\nAdd these to your .env file:");
  console.log("SUPABASE_URL=https://your-project.supabase.co");
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY=eyJ... (from Supabase Dashboard → Settings → API)"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SAMPLES_DIR = path.join(process.cwd(), "src", "samples");

interface UploadResult {
  file: string;
  success: boolean;
  url?: string;
  error?: string;
}

async function ensureBucketExists(): Promise<boolean> {
  console.log(`\n📦 Checking bucket "${BUCKET_NAME}"...`);

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("Failed to list buckets:", error.message);
    return false;
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (bucketExists) {
    console.log(`✅ Bucket "${BUCKET_NAME}" exists`);
  } else {
    console.log(`Creating bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: 52_428_800, // 50MB
      }
    );

    if (createError) {
      console.error("Failed to create bucket:", createError.message);
      return false;
    }
    console.log(`✅ Bucket "${BUCKET_NAME}" created`);
  }

  return true;
}

async function uploadFile(
  localPath: string,
  storagePath: string
): Promise<UploadResult> {
  const fileContent = fs.readFileSync(localPath);
  const fileName = path.basename(localPath);

  // Determine content type
  const ext = path.extname(localPath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".txt": "text/plain",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".pdf": "application/pdf",
  };
  const contentType = contentTypes[ext] || "application/octet-stream";

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileContent, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    return { file: storagePath, success: false, error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    file: storagePath,
    success: true,
    url: urlData.publicUrl,
  };
}

async function uploadAllSamples(): Promise<void> {
  console.log("🚀 Supabase Storage Upload Script");
  console.log("================================\n");

  // Check if samples directory exists
  if (!fs.existsSync(SAMPLES_DIR)) {
    console.error(`❌ Samples directory not found: ${SAMPLES_DIR}`);
    console.log(
      "\nRun 'bash scripts/upload-samples.sh' first to create sample files."
    );
    process.exit(1);
  }

  // Ensure bucket exists
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    process.exit(1);
  }

  const results: UploadResult[] = [];

  // Get all files directly in src/samples directory
  const files = fs.readdirSync(SAMPLES_DIR);

  console.log(`\n📁 Found ${files.length} files to upload...`);

  for (const file of files) {
    const localPath = path.join(SAMPLES_DIR, file);
    const stat = fs.statSync(localPath);

    // Skip directories
    if (stat.isDirectory()) {
      continue;
    }

    // Determine storage path based on file extension
    const ext = path.extname(file).toLowerCase();
    let storagePath: string;

    if (ext === ".pptx" || ext === ".ppt") {
      storagePath = `presentations/${file}`;
      console.log(`  📊 Uploading presentation: ${file}`);
    } else if (ext === ".mp4" || ext === ".webm" || ext === ".mov") {
      storagePath = `videos/${file}`;
      console.log(`  🎬 Uploading video: ${file}`);
    } else {
      storagePath = `other/${file}`;
      console.log(`  📄 Uploading file: ${file}`);
    }

    const result = await uploadFile(localPath, storagePath);
    results.push(result);
  }

  // Print summary
  console.log("\n================================");
  console.log("📋 Upload Summary\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log("\n📁 Uploaded files:");
    for (const result of successful) {
      console.log(`  • ${result.file}`);
      console.log(`    URL: ${result.url}`);
    }
  }

  if (failed.length > 0) {
    console.log("\n⚠️  Failed uploads:");
    for (const result of failed) {
      console.log(`  • ${result.file}: ${result.error}`);
    }
  }

  console.log("\n✨ Done!");
}

uploadAllSamples().catch(console.error);
