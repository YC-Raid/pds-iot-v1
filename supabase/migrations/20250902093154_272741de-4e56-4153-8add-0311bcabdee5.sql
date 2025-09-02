-- Fix security issues from the linter

-- 1. Remove foreign table from API exposure (security issue)
-- Foreign tables don't respect RLS policies, so we shouldn't expose them via API
REVOKE ALL ON sensor_data FROM anon, authenticated;

-- 2. Create data sync function that safely accesses FDW table
CREATE OR REPLACE FUNCTION sync_sensor_data_from_rds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_count INTEGER := 0;
  max_local_id INTEGER := 0;
  rec RECORD;
BEGIN
  -- Get the latest ID we've already processed
  SELECT COALESCE(MAX(original_id), 0) INTO max_local_id
  FROM processed_sensor_readings;
  
  -- Only admin users can sync data
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admin users can sync sensor data';
  END IF;
  
  -- Insert new records from FDW table with error handling
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
      (sd.local_date + sd.local_time)::timestamptz AT TIME ZONE 'UTC',
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
    LIMIT 1000; -- Batch processing to avoid timeouts
    
    GET DIAGNOSTICS synced_count = ROW_COUNT;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error and return 0 if FDW connection fails
    RAISE NOTICE 'FDW sync failed: %', SQLERRM;
    synced_count := 0;
  END;
  
  RETURN synced_count;
END;
$$;

-- 3. Create a safe function to get sensor data count from FDW
CREATE OR REPLACE FUNCTION get_rds_sensor_data_info()
RETURNS TABLE(
  total_count BIGINT,
  latest_timestamp TIMESTAMPTZ,
  connection_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to check connection status
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  BEGIN
    SELECT 
      COUNT(*) as total_count,
      MAX((local_date + local_time)::timestamptz AT TIME ZONE 'UTC') as latest_timestamp,
      'connected' as connection_status
    INTO total_count, latest_timestamp, connection_status
    FROM sensor_data;
    
  EXCEPTION WHEN OTHERS THEN
    total_count := 0;
    latest_timestamp := NULL;
    connection_status := 'connection_error';
  END;
  
  RETURN NEXT;
END;
$$;