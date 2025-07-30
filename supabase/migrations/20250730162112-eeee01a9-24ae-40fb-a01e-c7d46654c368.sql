-- Create alerts table for audit trails and persistence
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  category text NOT NULL CHECK (category IN ('environmental', 'equipment', 'electrical', 'system', 'maintenance')),
  equipment text NOT NULL,
  location text NOT NULL,
  sensor text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'acknowledged', 'in-progress', 'escalated', 'resolved', 'dismissed')),
  value text,
  threshold text,
  unit text,
  duration integer DEFAULT 0,
  impact text,
  priority text DEFAULT 'P4',
  assigned_to text,
  acknowledged_by text,
  acknowledged_at timestamp with time zone,
  resolved_by text,
  resolved_at timestamp with time zone,
  dismissed_by text,
  dismissed_at timestamp with time zone,
  root_cause text,
  corrective_actions text[],
  escalated boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create alert_notes table for investigation history
CREATE TABLE public.alert_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  text text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  author_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for alerts
CREATE POLICY "Users can view all alerts" 
ON public.alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alerts" 
ON public.alerts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for alert_notes
CREATE POLICY "Users can view all alert notes" 
ON public.alert_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert alert notes" 
ON public.alert_notes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at);
CREATE INDEX idx_alerts_category ON public.alerts(category);
CREATE INDEX idx_alert_notes_alert_id ON public.alert_notes(alert_id);