-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to trigger anomaly detection automatically
CREATE OR REPLACE FUNCTION public.trigger_anomaly_detection()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the detect-anomalies edge function asynchronously
  PERFORM net.http_post(
    url := 'https://txnghrvynzrxvshoctpk.supabase.co/functions/v1/detect-anomalies',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bmdocnZ5bnpyeHZzaG9jdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzkzNDMsImV4cCI6MjA2OTExNTM0M30.ZrA0TqpNKLy85_7raObo3lzXvBr-lK2crDgPJiUZCdw"}'::jsonb,
    body := json_build_object('trigger', 'auto', 'reading_id', NEW.id)::jsonb
  );
  
  -- Call the alert-monitor function for immediate threshold checking
  PERFORM net.http_post(
    url := 'https://txnghrvynzrxvshoctpk.supabase.co/functions/v1/alert-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bmdocnZ5bnpyeHZzaG9jdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzkzNDMsImV4cCI6MjA2OTExNTM0M30.ZrA0TqpNKLy85_7raObo3lzXvBr-lK2crDgPJiUZCdw"}'::jsonb,
    body := json_build_object(
      'temperature', NEW.temperature,
      'humidity', NEW.humidity,
      'pressure', NEW.pressure,
      'vibration', NEW.accel_magnitude,
      'pm25', NEW.pm2_5,
      'location', NEW.location,
      'equipment', 'hangar_sensor_system',
      'timestamp', NEW.recorded_at
    )::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires on new sensor readings
DROP TRIGGER IF EXISTS auto_anomaly_detection ON public.processed_sensor_readings;
CREATE TRIGGER auto_anomaly_detection
  AFTER INSERT ON public.processed_sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_anomaly_detection();