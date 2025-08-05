-- Add missing columns to alerts table to match what alert-monitor function expects
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS sensor_type text,
ADD COLUMN IF NOT EXISTS sensor_location text,
ADD COLUMN IF NOT EXISTS sensor_value numeric,
ADD COLUMN IF NOT EXISTS threshold_value numeric;

-- Also need to make the send-notification function work without RESEND_API_KEY for now
-- The function should handle missing email API key gracefully