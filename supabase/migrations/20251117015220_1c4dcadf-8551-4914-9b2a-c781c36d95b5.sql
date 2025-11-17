-- Modify sync function to only sync data from last 30 days (Asia/Singapore timezone)
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
      gyro_z
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
      sd.gyro_z
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

-- Create function to cleanup old sensor data (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_data()
RETURNS TABLE(deleted_readings INTEGER, deleted_alerts INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  readings_deleted INTEGER := 0;
  alerts_deleted INTEGER := 0;
  thirty_days_ago TIMESTAMPTZ;
BEGIN
  -- Calculate 30 days ago in Asia/Singapore timezone
  thirty_days_ago := (NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '30 days') AT TIME ZONE 'Asia/Singapore';
  
  -- Delete old sensor readings
  DELETE FROM processed_sensor_readings
  WHERE recorded_at < thirty_days_ago;
  
  GET DIAGNOSTICS readings_deleted = ROW_COUNT;
  
  -- Delete old alerts (keep alerts for 30 days as well)
  DELETE FROM alerts
  WHERE created_at < thirty_days_ago;
  
  GET DIAGNOSTICS alerts_deleted = ROW_COUNT;
  
  deleted_readings := readings_deleted;
  deleted_alerts := alerts_deleted;
  
  RETURN NEXT;
END;
$function$;

COMMENT ON FUNCTION public.sync_sensor_data_from_rds() IS 'Syncs sensor data from RDS, only importing records from the last 30 days (Asia/Singapore timezone)';
COMMENT ON FUNCTION public.cleanup_old_sensor_data() IS 'Deletes sensor readings and alerts older than 30 days to maintain database performance and prevent capacity issues';