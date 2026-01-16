-- Fix signup failure: qualify enum type and use a safe search_path
-- The auth.users trigger calls public.handle_new_user(); this function must not depend on search_path for custom types.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nickname', 'User'));

  -- Assign role: force admin for special email
  IF NEW.email = 'test1@gmail.com' THEN
    UPDATE public.user_roles
      SET role = 'admin'::public.app_role
      WHERE user_id = NEW.id;

    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin'::public.app_role);
    END IF;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer'::public.app_role);
  END IF;

  RETURN NEW;
END;
$$;

-- Optional hardening: also ensure our role-check function uses a deterministic search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;