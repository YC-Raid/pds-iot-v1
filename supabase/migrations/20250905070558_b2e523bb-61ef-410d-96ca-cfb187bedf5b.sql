-- Adjust sync to store timestamps as Asia/Singapore local time (no UTC conversion)
CREATE OR REPLACE FUNCTION public.sync_sensor_data_from_rds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  synced_count INTEGER := 0;
  max_local_id INTEGER := 0;
BEGIN
  -- Get the latest ID we've already processed
  SELECT COALESCE(MAX(original_id), 0) INTO max_local_id
  FROM public.processed_sensor_readings;
  
  -- Insert new records from FDW table with recorded_at interpreted in Asia/Singapore time
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