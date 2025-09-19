-- Add DELETE policy for alerts table to allow users to delete alerts
CREATE POLICY "Users can delete alerts" 
ON public.alerts 
FOR DELETE 
USING (true);