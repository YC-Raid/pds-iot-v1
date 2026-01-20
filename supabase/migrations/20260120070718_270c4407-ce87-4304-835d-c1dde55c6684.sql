-- Update user ycfromraid@gmail.com to admin role
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = 'd79058ca-c1ff-441c-9cbe-f4863cfe91f6';