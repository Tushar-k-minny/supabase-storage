#!/bin/bash
# Upload sample files to Supabase Storage
# Usage: ./upload-samples.sh

# Check if supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "npx is required but not installed."
    exit 1
fi

echo "📁 Creating sample files directory..."
mkdir -p supabase/samples/presentations
mkdir -p supabase/samples/videos

echo "📝 Creating sample placeholder files..."
# Create a simple text file as placeholder for PPT (since we can't create real ones)
echo "This is a placeholder for RAG Introduction presentation" > supabase/samples/presentations/rag-intro.txt
echo "This is a placeholder for ML Fundamentals presentation" > supabase/samples/presentations/ml-fundamentals.txt
echo "This is a placeholder for Transformers presentation" > supabase/samples/presentations/transformers.txt

echo "🎬 Creating sample video placeholders..."
echo "This is a placeholder for RAG Tutorial video" > supabase/samples/videos/rag-tutorial.txt
echo "This is a placeholder for Neural Networks video" > supabase/samples/videos/neural-networks.txt
echo "This is a placeholder for LLM Apps video" > supabase/samples/videos/llm-apps.txt

echo ""
echo "✅ Sample files created in supabase/samples/"
echo ""
echo "To upload to Supabase Storage, use the Supabase Dashboard:"
echo "1. Go to https://app.supabase.com → Your Project → Storage"
echo "2. Create a bucket named 'learning-materials'"
echo "3. Upload the files maintaining the folder structure"
echo ""
echo "Or use the Supabase API with curl (requires your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY):"
echo ""
echo "Example:"
echo "curl -X POST '\$SUPABASE_URL/storage/v1/object/learning-materials/presentations/rag-intro.txt' \\"
echo "  -H 'Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY' \\"
echo "  -H 'Content-Type: text/plain' \\"
echo "  --data-binary @supabase/samples/presentations/rag-intro.txt"
