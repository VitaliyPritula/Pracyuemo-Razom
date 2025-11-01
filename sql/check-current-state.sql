-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if app_role enum exists
SELECT typname 
FROM pg_type 
WHERE typname = 'app_role';

-- Check RLS status for tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
