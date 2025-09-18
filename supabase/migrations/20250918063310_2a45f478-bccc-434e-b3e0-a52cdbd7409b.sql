-- Update the trigger function to pass accelerometer data to alert-monitor
CREATE OR REPLACE FUNCTION public.trigger_anomaly_detection()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the detect-anomalies edge function asynchronously
  PERFORM net.http_post(
    url := 'https://txnghrvynzrxvshoctpk.supabase.co/functions/v1/detect-anomalies',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bmdocnZ5bnpyeHZzaG9jdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzkzNDMsImV4cCI6MjA2OTExNTM0M30.ZrA0TqpNKLy85_7raObo3lzXvBr-lK2crDgPJiUZCdw"}'::jsonb,
    body := json_build_object('trigger', 'auto', 'reading_id', NEW.id)::jsonb
  );
  
  -- Call the alert-monitor function for immediate threshold checking with accelerometer data
  PERFORM net.http_post(
    url := 'https://txnghrvynzrxvshoctpk.supabase.co/functions/v1/alert-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bmdocnZ5bnpyeHZzaG9jdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzkzNDMsImV4cCI6MjA2OTExNTM0M30.ZrA0TqpNKLy85_7raObo3lzXvBr-lK2crDgPJiUZCdw"}'::jsonb,
    body := json_build_object(
      'temperature', NEW.temperature,
      'humidity', NEW.humidity,
      'pressure', NEW.pressure,
      'vibration', NEW.accel_magnitude,
      'accel_x', NEW.accel_x,
      'accel_y', NEW.accel_y,
      'accel_z', NEW.accel_z,
      'pm25', NEW.pm2_5,
      'sensor_location', NEW.location,
      'location', NEW.location,
      'equipment', 'hangar_sensor_system',
      'timestamp', NEW.recorded_at
    )::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;