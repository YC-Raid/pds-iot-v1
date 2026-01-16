-- Add door security columns to processed_sensor_readings table
ALTER TABLE processed_sensor_readings 
ADD COLUMN IF NOT EXISTS door_status TEXT DEFAULT 'CLOSED',
ADD COLUMN IF NOT EXISTS door_opens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS intrusion_alert BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS door_opened_at TIMESTAMP WITH TIME ZONE;

-- Add index for intrusion alerts for faster querying
CREATE INDEX IF NOT EXISTS idx_processed_sensor_readings_intrusion 
ON processed_sensor_readings (intrusion_alert) 
WHERE intrusion_alert = TRUE;

-- Add index for door status monitoring
CREATE INDEX IF NOT EXISTS idx_processed_sensor_readings_door_status 
ON processed_sensor_readings (door_status, door_opened_at) 
WHERE door_status = 'OPEN';

-- Update sync function to include door security fields
CREATE OR REPLACE FUNCTION public.sync_sensor_data_from_rds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  synced_count INTEGER := 0;
  max_local_id INTEGER := 0;
  thirty_days_ago TIMESTAMPTZ;
BEGIN
  -- Calculate 30 days ago in Asia/Singapore timezone
  thirty_days_ago := (NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '30 days') AT TIME ZONE 'Asia/Singapore';
  
  -- Get the latest ID we've already processed
  SELECT COALESCE(MAX(original_id), 0) INTO max_local_id
  FROM public.processed_sensor_readings;
  
  -- Insert new records from FDW table with 30-day filter
  BEGIN
    INSERT INTO processed_sensor_readings (
      original_id,
      recorded_at,
      temperature,
      humidity,
      pressure,
      gas_resistance,
      pm1_0,
      pm2_5,
      pm10,
      accel_x,
      accel_y,
      accel_z,
      gyro_x,
      gyro_y,
      gyro_z,
      door_status,
      door_opens,
      intrusion_alert,
      door_opened_at
    )
    SELECT 
      sd.id,
      (sd.local_date + sd.local_time) AT TIME ZONE 'Asia/Singapore',
      sd.temperature,
      sd.humidity,
      sd.pressure,
      sd.gas_resistance,
      sd.pm1_0,
      sd.pm2_5,
      sd.pm10,
      sd.accel_x,
      sd.accel_y,
      sd.accel_z,
      sd.gyro_x,
      sd.gyro_y,
      sd.gyro_z,
      COALESCE(sd.door_status, 'CLOSED'),
      COALESCE(sd.door_opens, 0),
      COALESCE(sd.intrusion_alert, FALSE),
      CASE WHEN sd.door_status = 'OPEN' THEN (sd.local_date + sd.local_time) AT TIME ZONE 'Asia/Singapore' ELSE NULL END
    FROM sensor_data sd
    WHERE sd.id > max_local_id
      AND (sd.local_date + sd.local_time) AT TIME ZONE 'Asia/Singapore' >= thirty_days_ago
    ORDER BY sd.id
    LIMIT 1000;
    
    GET DIAGNOSTICS synced_count = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FDW sync failed: %', SQLERRM;
    synced_count := 0;
  END;
  
  RETURN synced_count;
END;
$function$;

-- Create table to track security alert emails to prevent duplicates
CREATE TABLE IF NOT EXISTS security_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  reading_id BIGINT REFERENCES processed_sensor_readings(id),
  email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security_alert_log
ALTER TABLE security_alert_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and insert security logs
CREATE POLICY "Users can view security alert logs" 
ON security_alert_log 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert security logs" 
ON security_alert_log 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role') = 'service_role');

COMMENT ON TABLE security_alert_log IS 'Tracks security alert emails to prevent duplicate notifications';
COMMENT ON COLUMN processed_sensor_readings.door_status IS 'Door status: OPEN or CLOSED';
COMMENT ON COLUMN processed_sensor_readings.door_opens IS 'Total number of door opens (entries)';
COMMENT ON COLUMN processed_sensor_readings.intrusion_alert IS 'True if intrusion detected during restricted hours';
COMMENT ON COLUMN processed_sensor_readings.door_opened_at IS 'Timestamp when door was opened (for monitoring duration)';