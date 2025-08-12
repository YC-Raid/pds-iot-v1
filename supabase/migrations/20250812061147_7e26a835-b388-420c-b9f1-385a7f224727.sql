-- Ensure user test1@gmail.com is Admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test1@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update existing role rows for this user to admin
    UPDATE public.user_roles SET role = 'admin'::app_role WHERE user_id = v_user_id;

    -- Insert admin role if no row exists
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin'::app_role);
    END IF;
  END IF;
END $$;