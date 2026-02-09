
-- Add user_id column to vibration_monitoring_settings for per-user per-location thresholds
ALTER TABLE public.vibration_monitoring_settings
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old unique constraint on location (if any) and create new composite unique
ALTER TABLE public.vibration_monitoring_settings
  ADD CONSTRAINT vibration_monitoring_settings_user_location_unique UNIQUE (user_id, location);

-- Update RLS policies to be per-user
DROP POLICY IF EXISTS "Authenticated users can insert vibration settings" ON public.vibration_monitoring_settings;
DROP POLICY IF EXISTS "Authenticated users can update vibration settings" ON public.vibration_monitoring_settings;
DROP POLICY IF EXISTS "Users can view vibration settings" ON public.vibration_monitoring_settings;

-- Users can only view their own vibration settings
CREATE POLICY "Users can view their own vibration settings"
  ON public.vibration_monitoring_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vibration settings
CREATE POLICY "Users can insert their own vibration settings"
  ON public.vibration_monitoring_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vibration settings
CREATE POLICY "Users can update their own vibration settings"
  ON public.vibration_monitoring_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all vibration settings
CREATE POLICY "Admins can view all vibration settings"
  ON public.vibration_monitoring_settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
