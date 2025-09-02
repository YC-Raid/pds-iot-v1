-- Create FDW user mappings and grants for AWS RDS access
-- Using provided credentials

-- Ensure roles can use the foreign server
GRANT USAGE ON FOREIGN SERVER aws_rds TO supabase_admin;
GRANT USAGE ON FOREIGN SERVER aws_rds TO supabase_read_only_user;

-- Create or replace user mappings with RDS credentials
DROP USER MAPPING IF EXISTS FOR supabase_admin SERVER aws_rds;
CREATE USER MAPPING FOR supabase_admin
  SERVER aws_rds
  OPTIONS (user 'ycraid', password '9924404YCR4!D');

DROP USER MAPPING IF EXISTS FOR supabase_read_only_user SERVER aws_rds;
CREATE USER MAPPING FOR supabase_read_only_user
  SERVER aws_rds
  OPTIONS (user 'ycraid', password '9924404YCR4!D');

-- Allow only supabase_admin to read the foreign table for RPC processing
GRANT SELECT ON sensor_data TO supabase_admin;
-- Do NOT grant to anon/authenticated to keep FDW table out of API
REVOKE ALL ON sensor_data FROM anon, authenticated;