-- Create vibration monitoring settings table
CREATE TABLE public.vibration_monitoring_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL DEFAULT 'hangar_01',
  foundation_stress_threshold REAL NOT NULL DEFAULT 2.0,
  wall_integrity_threshold REAL NOT NULL DEFAULT 1.5,
  roof_stability_threshold REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(location)
);

-- Enable Row Level Security
ALTER TABLE public.vibration_monitoring_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view vibration settings" 
ON public.vibration_monitoring_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert vibration settings" 
ON public.vibration_monitoring_settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vibration settings" 
ON public.vibration_monitoring_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Insert default settings for hangar_01
INSERT INTO public.vibration_monitoring_settings (location, foundation_stress_threshold, wall_integrity_threshold, roof_stability_threshold)
VALUES ('hangar_01', 2.0, 1.5, 1.0);

-- Create trigger for updated_at
CREATE TRIGGER update_vibration_settings_updated_at
BEFORE UPDATE ON public.vibration_monitoring_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();