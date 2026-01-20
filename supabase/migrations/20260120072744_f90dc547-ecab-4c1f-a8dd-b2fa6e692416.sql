-- Fix the overly permissive alerts delete policy
-- Drop the current policy that allows any authenticated user to delete any alert
DROP POLICY IF EXISTS "Users can delete alerts" ON public.alerts;

-- Create policy: Only alert creators can delete their own alerts
CREATE POLICY "Users can delete their own alerts" 
ON public.alerts 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create policy: Admins can delete any alert
CREATE POLICY "Admins can delete any alert" 
ON public.alerts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));