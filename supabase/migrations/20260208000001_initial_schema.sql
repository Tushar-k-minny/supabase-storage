-- =============================================
-- Learn with Jiji - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-02-08
-- =============================================

-- Note: gen_random_uuid() is built into PostgreSQL 13+
-- No extension needed for Supabase

-- =============================================
-- Table: profiles
-- Stores user profile information
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =============================================
-- Table: resources
-- Stores learning resources (PPT, videos, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('ppt', 'video')),
    file_url TEXT NOT NULL,
    storage_path TEXT, -- Path in Supabase Storage
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_title ON resources USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_resources_description ON resources USING GIN(to_tsvector('english', COALESCE(description, '')));

-- =============================================
-- Table: queries
-- Stores user queries/questions
-- =============================================
CREATE TABLE IF NOT EXISTS queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    answer_text TEXT,
    resources_returned UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user queries lookup
CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own queries" ON queries;
DROP POLICY IF EXISTS "Users can insert own queries" ON queries;
DROP POLICY IF EXISTS "Users can delete own queries" ON queries;
DROP POLICY IF EXISTS "Authenticated users can view resources" ON resources;
DROP POLICY IF EXISTS "Service role can manage resources" ON resources;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Queries policies
CREATE POLICY "Users can view own queries"
    ON queries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries"
    ON queries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queries"
    ON queries FOR DELETE
    USING (auth.uid() = user_id);

-- Resources policies (public read for authenticated users)
CREATE POLICY "Authenticated users can view resources"
    ON resources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage resources"
    ON resources FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist (for idempotent migrations)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Trigger to sync auth.users with profiles
-- =============================================
-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Sample Data (idempotent - uses ON CONFLICT)
-- =============================================
-- First, clear existing sample data to avoid duplicates
DELETE FROM resources WHERE title IN (
    'Introduction to RAG',
    'RAG Tutorial Video',
    'Machine Learning Fundamentals',
    'Neural Networks Explained',
    'Transformer Architecture',
    'Building LLM Applications'
);

INSERT INTO resources (id, title, description, type, file_url, storage_path, tags) VALUES
    (
        gen_random_uuid(),
        'Introduction to RAG',
        'Learn the basics of Retrieval-Augmented Generation and how it enhances LLM responses',
        'ppt',
        'https://your-supabase-url.supabase.co/storage/v1/object/public/learning-materials/presentations/rag-intro.pptx',
        'presentations/rag-intro.pptx',
        ARRAY['rag', 'ai', 'llm', 'retrieval', 'generation']
    ),
    (
        gen_random_uuid(),
        'RAG Tutorial Video',
        'Step-by-step RAG implementation guide with practical examples',
        'video',
        'https://your-supabase-url.supabase.co/storage/v1/object/public/learning-materials/videos/rag-tutorial.mp4',
        'videos/rag-tutorial.mp4',
        ARRAY['rag', 'tutorial', 'video', 'hands-on']
    ),
    (
        gen_random_uuid(),
        'Machine Learning Fundamentals',
        'Complete ML course presentation covering supervised and unsupervised learning',
        'ppt',
        'https://your-supabase-url.supabase.co/storage/v1/object/public/learning-materials/presentations/ml-fundamentals.pptx',
        'presentations/ml-fundamentals.pptx',
        ARRAY['machine learning', 'ml', 'basics', 'supervised', 'unsupervised']
    ),
    (
        gen_random_uuid(),
        'Neural Networks Explained',
        'Deep dive into neural networks architecture and training',
        'video',
        'https://your-supabase-url.supabase.co/storage/v1/object/public/learning-materials/videos/neural-networks.mp4',
        'videos/neural-networks.mp4',
        ARRAY['neural network', 'deep learning', 'ai', 'architecture']
    ),
    (
        gen_random_uuid(),
        'Transformer Architecture',
        'Understanding the transformer model that powers modern LLMs',
        'ppt',
        'https://your-supabase-url.supabase.co/storage/v1/object/public/learning-materials/presentations/transformers.pptx',
        'presentations/transformers.pptx',
        ARRAY['transformer', 'attention', 'llm', 'architecture', 'nlp']
    ),
    (
        gen_random_uuid(),
        'Building LLM Applications',
        'Practical guide to building applications with large language models',
        'video',
        'https://your-supabase-url.supabase.co/storage/v1/object/public/learning-materials/videos/llm-apps.mp4',
        'videos/llm-apps.mp4',
        ARRAY['llm', 'applications', 'development', 'practical']
    );

-- =============================================
-- Storage Bucket Setup (run in Supabase Dashboard SQL Editor)
-- =============================================
-- Note: Storage bucket creation is done via Supabase Dashboard or API
-- The following is for reference:
--
-- 1. Create bucket: learning-materials
-- 2. Make it public (or configure RLS policies)
-- 3. Upload sample files:
--    - presentations/rag-intro.pptx
--    - presentations/ml-fundamentals.pptx
--    - presentations/transformers.pptx
--    - videos/rag-tutorial.mp4
--    - videos/neural-networks.mp4
--    - videos/llm-apps.mp4
