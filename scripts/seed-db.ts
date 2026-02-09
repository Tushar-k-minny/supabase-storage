import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!(SUPABASE_URL && SUPABASE_SERVICE_KEY)) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =============================================
// Sample Resources Data
// =============================================
const sampleResources = [
  {
    title: "Introduction to RAG",
    description:
      "Learn the basics of Retrieval-Augmented Generation and how it enhances LLM responses with external knowledge.",
    type: "ppt",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/presentations/example.pptx`,
    storage_path: "presentations/example.pptx",
    tags: ["rag", "ai", "llm", "retrieval", "generation"],
  },
  {
    title: "RAG Tutorial Video",
    description:
      "Step-by-step RAG implementation guide with practical examples and code walkthroughs.",
    type: "video",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/videos/example.mp4`,
    storage_path: "videos/example.mp4",
    tags: ["rag", "tutorial", "video", "hands-on"],
  },
  {
    title: "Machine Learning Fundamentals",
    description:
      "Complete ML course covering supervised learning, unsupervised learning, and model evaluation techniques.",
    type: "ppt",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/presentations/ml-fundamentals.pptx`,
    storage_path: "presentations/ml-fundamentals.pptx",
    tags: ["machine learning", "ml", "basics", "supervised", "unsupervised"],
  },
  {
    title: "Neural Networks Explained",
    description:
      "Deep dive into neural networks architecture, backpropagation, and training techniques.",
    type: "video",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/videos/neural-networks.mp4`,
    storage_path: "videos/neural-networks.mp4",
    tags: ["neural network", "deep learning", "ai", "architecture"],
  },
  {
    title: "Transformer Architecture",
    description:
      "Understanding the transformer model that powers modern LLMs like GPT and BERT.",
    type: "ppt",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/presentations/transformers.pptx`,
    storage_path: "presentations/transformers.pptx",
    tags: ["transformer", "attention", "llm", "architecture", "nlp"],
  },
  {
    title: "Building LLM Applications",
    description:
      "Practical guide to building applications with large language models including prompt engineering.",
    type: "video",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/videos/llm-apps.mp4`,
    storage_path: "videos/llm-apps.mp4",
    tags: ["llm", "applications", "development", "practical"],
  },
  {
    title: "Vector Databases Overview",
    description:
      "Introduction to vector databases and their role in semantic search and RAG systems.",
    type: "ppt",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/presentations/vector-db.pptx`,
    storage_path: "presentations/vector-db.pptx",
    tags: ["vector database", "embeddings", "semantic search", "rag"],
  },
  {
    title: "Prompt Engineering Masterclass",
    description:
      "Advanced techniques for crafting effective prompts for various AI applications.",
    type: "video",
    file_url: `${SUPABASE_URL}/storage/v1/object/public/learning-materials/videos/prompt-engineering.mp4`,
    storage_path: "videos/prompt-engineering.mp4",
    tags: ["prompt engineering", "llm", "ai", "techniques"],
  },
];

// =============================================
// Seed Functions
// =============================================

async function clearResources(): Promise<void> {
  console.log("🗑️  Clearing existing resources...");

  const { error } = await supabase
    .from("resources")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (error) {
    console.error("Error clearing resources:", error.message);
  } else {
    console.log("✅ Resources cleared");
  }
}

async function seedResources(): Promise<void> {
  console.log("📚 Seeding resources...");

  for (const resource of sampleResources) {
    const { data, error } = await supabase
      .from("resources")
      .upsert(resource, {
        onConflict: "title",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      // Try insert if upsert fails (title might not be unique constraint)
      const { error: insertError } = await supabase
        .from("resources")
        .insert(resource);

      if (insertError) {
        console.error(
          `  ❌ Failed to seed "${resource.title}":`,
          insertError.message
        );
      } else {
        console.log(`  ✅ ${resource.title}`);
      }
    } else {
      console.log(`  ✅ ${resource.title}`);
    }
  }
}

async function showStats(): Promise<void> {
  console.log("\n📊 Database Stats:");

  // Count resources
  const { count: resourceCount, error: resourceError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true });

  if (!resourceError) {
    console.log(`  • Resources: ${resourceCount}`);
  }

  // Count by type
  const { data: pptCount } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("type", "ppt");

  const { data: videoCount } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("type", "video");

  // Count queries
  const { count: queryCount, error: queryError } = await supabase
    .from("queries")
    .select("*", { count: "exact", head: true });

  if (!queryError) {
    console.log(`  • Queries: ${queryCount || 0}`);
  }

  // Count profiles
  const { count: profileCount, error: profileError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (!profileError) {
    console.log(`  • Profiles: ${profileCount || 0}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear") || args.includes("-c");
  const showHelp = args.includes("--help") || args.includes("-h");

  console.log("🌱 Learn with Jiji - Database Seeder");
  console.log("=====================================\n");

  if (showHelp) {
    console.log("Usage: pnpm db:seed [options]\n");
    console.log("Options:");
    console.log("  --clear, -c    Clear existing data before seeding");
    console.log("  --help, -h     Show this help message");
    console.log("");
    return;
  }

  console.log(`📦 Supabase URL: ${SUPABASE_URL}`);
  console.log(
    `🔑 Using: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "Service Role Key" : "Anon Key"}\n`
  );

  if (shouldClear) {
    await clearResources();
    console.log("");
  }

  await seedResources();
  await showStats();

  console.log("\n✨ Seeding complete!");
}

main().catch(console.error);
