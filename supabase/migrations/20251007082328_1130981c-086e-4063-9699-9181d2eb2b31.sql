-- Fix RLS policy for alerts to allow service role insertions
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alerts;

-- Create policy that allows both authenticated users and service role
CREATE POLICY "Allow alert insertions"
ON public.alerts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  OR 
  auth.jwt()->>'role' = 'service_role'
);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule archive-sensor-data edge function to run daily at 12:00 AM Asia/Singapore (GMT+8)
-- Since pg_cron uses UTC, 12:00 AM SGT = 4:00 PM previous day UTC (16:00)
SELECT cron.schedule(
  'daily-sensor-data-archiving',
  '0 16 * * *', -- 4 PM UTC = 12 AM SGT next day
  $$
  SELECT
    net.http_post(
      url := 'https://txnghrvynzrxvshoctpk.supabase.co/functions/v1/archive-sensor-data',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bmdocnZ5bnpyeHZzaG9jdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzkzNDMsImV4cCI6MjA2OTExNTM0M30.ZrA0TqpNKLy85_7raObo3lzXvBr-lK2crDgPJiUZCdw"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);