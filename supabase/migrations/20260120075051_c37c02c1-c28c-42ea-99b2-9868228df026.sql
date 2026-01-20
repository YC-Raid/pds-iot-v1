-- Add user_id column to alerts table to support per-user alert visibility
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);

-- Update RLS policy to show only user's own alerts
DROP POLICY IF EXISTS "Users can view all alerts" ON public.alerts;

CREATE POLICY "Users can view their own alerts"
ON public.alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Also allow admins to view all alerts
CREATE POLICY "Admins can view all alerts"
ON public.alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the update policy to only allow users to update their own alerts
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.alerts;

CREATE POLICY "Users can update their own alerts"
ON public.alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any alert
CREATE POLICY "Admins can update any alert"
ON public.alerts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update default for vibration threshold to 30
ALTER TABLE public.notification_settings
ALTER COLUMN alert_threshold_vibration SET DEFAULT 30;

-- Update existing NULL or 10 threshold values to 30 as the new default
UPDATE public.notification_settings
SET alert_threshold_vibration = 30
WHERE alert_threshold_vibration IS NULL OR alert_threshold_vibration = 10;