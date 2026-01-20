-- Drop and recreate the foreign table with all columns including door/security fields
-- (ALTER FOREIGN TABLE ADD COLUMN is the correct syntax for FDW tables)

ALTER FOREIGN TABLE IF EXISTS public.sensor_data
  ADD COLUMN IF NOT EXISTS door_status text,
  ADD COLUMN IF NOT EXISTS door_opens integer,
  ADD COLUMN IF NOT EXISTS door_closes integer,
  ADD COLUMN IF NOT EXISTS intrusion_alert boolean;