-- Lock test1@gmail.com as Admin via triggers and ensure bootstrap triggers exist
-- 1) Attach handle_new_user to auth.users (creates profile + role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 2) Ensure notification settings are auto-created when a profile is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_created_init_notification_settings'
  ) THEN
    CREATE TRIGGER on_profile_created_init_notification_settings
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_settings();
  END IF;
END
$$;

-- 3) Enforce that the user with email 'test1@gmail.com' is always admin in user_roles
-- The function public.enforce_admin_role_for_test1() already exists per project config.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_admin_role_for_test1_trg'
  ) THEN
    CREATE TRIGGER enforce_admin_role_for_test1_trg
    BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_role_for_test1();
  END IF;
END
$$;