-- Expose door/security columns on the FDW foreign table in Supabase
-- (The sync function reads these fields from public.sensor_data)
ALTER TABLE public.sensor_data
  ADD COLUMN IF NOT EXISTS door_status text,
  ADD COLUMN IF NOT EXISTS door_opens integer,
  ADD COLUMN IF NOT EXISTS door_closes integer,
  ADD COLUMN IF NOT EXISTS intrusion_alert boolean;