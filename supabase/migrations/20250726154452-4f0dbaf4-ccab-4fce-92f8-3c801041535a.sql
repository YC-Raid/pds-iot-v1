-- Get the user ID for ycfromraid@gmail.com and update their role to admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'ycfromraid@gmail.com'
);

-- If no role exists yet, insert admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'ycfromraid@gmail.com'
  AND id NOT IN (SELECT user_id FROM public.user_roles);

-- Verify the change
SELECT u.email, ur.role 
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'ycfromraid@gmail.com';