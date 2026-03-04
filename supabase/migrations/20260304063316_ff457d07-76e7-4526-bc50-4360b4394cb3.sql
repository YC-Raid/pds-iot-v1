
-- Restore admin check to sync_sensor_data_from_rds and standardize search_path
CREATE OR REPLACE FUNCTION public.sync_sensor_data_from_rds()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  synced_count integer := 0;
  max_original_id integer;
  cutoff_date timestamp with time zone;
BEGIN
  -- CRITICAL: Only admin users can sync data (defense in depth)
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(MAX(original_id), 0) INTO max_original_id FROM public.processed_sensor_readings;
  
  cutoff_date := (NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '30 days')::timestamp with time zone;

  INSERT INTO public.processed_sensor_readings (
    original_id, recorded_at, temperature, humidity, pressure,
    pm1_0, pm2_5, pm10, gas_resistance,
    accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,
    location, processed_at, processing_version,
    door_status, door_opens, door_closes, intrusion_alert
  )
  SELECT
    sd.id, sd.utc_timestamp, sd.temperature, sd.humidity, sd.pressure,
    sd.pm1_0, sd.pm2_5, sd.pm10, sd.gas_resistance,
    sd.accel_x, sd.accel_y, sd.accel_z, sd.gyro_x, sd.gyro_y, sd.gyro_z,
    'Hangar', NOW(), 'v2.1-security',
    sd.door_status, sd.door_opens, sd.door_closes, sd.intrusion_alert
  FROM public.sensor_data sd
  WHERE sd.id > max_original_id
    AND sd.utc_timestamp >= cutoff_date
  ON CONFLICT (original_id) DO NOTHING;

  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN synced_count;
END;
$function$;

-- Add admin check to get_rds_sensor_data_info and standardize search_path
CREATE OR REPLACE FUNCTION public.get_rds_sensor_data_info()
 RETURNS TABLE(total_count bigint, latest_timestamp timestamp with time zone, connection_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only admin users can view RDS connection info
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  BEGIN
    SELECT 
      COUNT(*) as total_count,
      MAX((local_date + local_time)::timestamptz AT TIME ZONE 'UTC') as latest_timestamp,
      'connected' as connection_status
    INTO total_count, latest_timestamp, connection_status
    FROM public.sensor_data;
  EXCEPTION WHEN OTHERS THEN
    total_count := 0;
    latest_timestamp := NULL;
    connection_status := 'connection_error';
  END;
  
  RETURN NEXT;
END;
$function$;
