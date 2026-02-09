-- =============================================
-- Migration: Update RLS policies for queries table
-- Ensures user_id is compared with auth.users(id)
-- =============================================

-- =============================================
-- Sync existing auth.users to profiles
-- =============================================
INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.raw_user_meta_data->>'avatar_url' as avatar_url,
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- =============================================
-- Ensure trigger is properly set up for future users
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Fix existing data relationships
-- =============================================
-- Update any queries with orphaned user_ids to NULL
UPDATE queries 
SET user_id = NULL
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM profiles);

-- =============================================
-- Update RLS policies
-- =============================================
DROP POLICY IF EXISTS "Users can view own queries" ON queries;
DROP POLICY IF EXISTS "Users can insert own queries" ON queries;
DROP POLICY IF EXISTS "Users can delete own queries" ON queries;

CREATE POLICY "Users can view own queries"
    ON queries FOR SELECT
    USING (user_id IN (
        SELECT id FROM auth.users WHERE id = auth.uid()
    ) OR user_id IS NULL);

CREATE POLICY "Users can insert own queries"
    ON queries FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM auth.users WHERE id = auth.uid()
    ) OR user_id IS NULL);

CREATE POLICY "Users can delete own queries"
    ON queries FOR DELETE
    USING (user_id IN (
        SELECT id FROM auth.users WHERE id = auth.uid()
    ));

-- Also update profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (id IN (SELECT id FROM auth.users WHERE id = auth.uid()));
