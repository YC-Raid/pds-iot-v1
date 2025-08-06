-- Create maintenance_tasks table
CREATE TABLE public.maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
  assignee_id UUID REFERENCES public.profiles(user_id),
  equipment TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('routine', 'emergency', 'predictive')) DEFAULT 'routine',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_tasks
CREATE POLICY "Users can view all maintenance tasks" 
ON public.maintenance_tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create maintenance tasks" 
ON public.maintenance_tasks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their assigned tasks and creators can update their tasks" 
ON public.maintenance_tasks 
FOR UPDATE 
USING (auth.uid() = assignee_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete tasks they created" 
ON public.maintenance_tasks 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_tasks_updated_at
BEFORE UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();