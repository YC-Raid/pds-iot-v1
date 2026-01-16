-- Drop the duplicate trigger that causes the notification_settings insert to fail
DROP TRIGGER IF EXISTS on_profile_created_init_notification_settings ON public.profiles;

-- Update the handle_new_user_notification_settings function to handle duplicates gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;