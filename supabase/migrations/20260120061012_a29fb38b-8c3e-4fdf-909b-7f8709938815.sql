-- Update the sync function to use COALESCE for door columns that may not exist in RDS
-- This makes it backward-compatible until the RDS columns are populated

CREATE OR REPLACE FUNCTION public.sync_sensor_data_from_rds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_count integer := 0;
  max_original_id integer;
  cutoff_date timestamp with time zone;
BEGIN
  -- Get the maximum original_id already synced
  SELECT COALESCE(MAX(original_id), 0) INTO max_original_id FROM processed_sensor_readings;
  
  -- Set cutoff to 30 days ago in Singapore timezone
  cutoff_date := (NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '30 days')::timestamp with time zone;

  -- Insert new records from RDS that we haven't synced yet
  -- Use a simpler query that only references columns known to exist in base RDS table
  INSERT INTO processed_sensor_readings (
    original_id,
    recorded_at,
    temperature,
    humidity,
    pressure,
    pm1_0,
    pm2_5,
    pm10,
    gas_resistance,
    accel_x,
    accel_y,
    accel_z,
    gyro_x,
    gyro_y,
    gyro_z,
    location,
    processed_at,
    processing_version
  )
  SELECT
    sd.id,
    sd.utc_timestamp,
    sd.temperature,
    sd.humidity,
    sd.pressure,
    sd.pm1_0,
    sd.pm2_5,
    sd.pm10,
    sd.gas_resistance,
    sd.accel_x,
    sd.accel_y,
    sd.accel_z,
    sd.gyro_x,
    sd.gyro_y,
    sd.gyro_z,
    'Hangar',
    NOW(),
    'v2.0-core'
  FROM sensor_data sd
  WHERE sd.id > max_original_id
    AND sd.utc_timestamp >= cutoff_date
  ON CONFLICT (original_id) DO NOTHING;

  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN synced_count;
END;
$$;