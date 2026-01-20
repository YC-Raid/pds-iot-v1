-- Add door_closes column to processed_sensor_readings
ALTER TABLE public.processed_sensor_readings
ADD COLUMN IF NOT EXISTS door_closes INTEGER DEFAULT 0;

-- Update sync function to read door columns from RDS
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
  -- Reading door columns from RDS: door_status, door_opens, door_closes, intrusion_alert
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
    door_closes,
    intrusion_alert,
    location
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
    COALESCE(sd.door_closes, 0),
    COALESCE(sd.intrusion_alert, FALSE),
    'hangar_01'
  FROM sensor_data sd
  WHERE sd.id > max_local_id
    AND (sd.local_date + sd.local_time) AT TIME ZONE 'Asia/Singapore' >= thirty_days_ago
  ORDER BY sd.id
  LIMIT 1000;
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN synced_count;
END;
$function$;