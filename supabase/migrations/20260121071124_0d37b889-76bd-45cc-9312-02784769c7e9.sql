-- Add policy to allow admins to update any maintenance task
CREATE POLICY "Admins can update any maintenance task" 
ON public.maintenance_tasks 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy to allow admins to delete any maintenance task
CREATE POLICY "Admins can delete any maintenance task" 
ON public.maintenance_tasks 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));