
-- Step 1: Add individual axis columns to sensor_readings_aggregated
ALTER TABLE public.sensor_readings_aggregated
  ADD COLUMN IF NOT EXISTS avg_accel_x real,
  ADD COLUMN IF NOT EXISTS avg_accel_y real,
  ADD COLUMN IF NOT EXISTS avg_accel_z real,
  ADD COLUMN IF NOT EXISTS avg_gyro_x real,
  ADD COLUMN IF NOT EXISTS avg_gyro_y real,
  ADD COLUMN IF NOT EXISTS avg_gyro_z real;

-- Step 2: Recreate aggregate_sensor_data_1min to include x/y/z axes
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_1min()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    avg_accel_x, avg_accel_y, avg_accel_z,
    avg_gyro_x, avg_gyro_y, avg_gyro_z,
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('minute', recorded_at),
    '1min',
    COALESCE(location, 'Hangar'),
    AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance),
    AVG(pm1_0::real), AVG(pm2_5::real), AVG(pm10::real),
    AVG(accel_magnitude), AVG(gyro_magnitude),
    AVG(accel_x), AVG(accel_y), AVG(accel_z),
    AVG(gyro_x), AVG(gyro_y), AVG(gyro_z),
    MIN(temperature), MAX(temperature),
    COUNT(*)::integer
  FROM public.processed_sensor_readings
  WHERE recorded_at < date_trunc('minute', NOW())
    AND date_trunc('minute', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = '1min'
    )
  GROUP BY date_trunc('minute', recorded_at), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Step 3: Recreate aggregate_sensor_data_hourly with x/y/z (weighted avg from 1min)
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_hourly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    avg_accel_x, avg_accel_y, avg_accel_z,
    avg_gyro_x, avg_gyro_y, avg_gyro_z,
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('hour', time_bucket),
    'hour',
    COALESCE(location, 'Hangar'),
    SUM(avg_temperature * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_humidity * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pressure * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gas_resistance * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm1_0 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm2_5 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm10 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    MIN(min_temperature),
    MAX(max_temperature),
    SUM(data_points_count)::integer
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = '1min'
    AND time_bucket < date_trunc('hour', NOW())
    AND date_trunc('hour', time_bucket) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour'
    )
  GROUP BY date_trunc('hour', time_bucket), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Step 4: Recreate aggregate_sensor_data_daily with x/y/z (weighted avg from hourly)
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_daily()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    avg_accel_x, avg_accel_y, avg_accel_z,
    avg_gyro_x, avg_gyro_y, avg_gyro_z,
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore',
    'day',
    COALESCE(location, 'Hangar'),
    SUM(avg_temperature * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_humidity * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pressure * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gas_resistance * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm1_0 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm2_5 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm10 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    MIN(min_temperature),
    MAX(max_temperature),
    SUM(data_points_count)::integer
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'hour'
    AND time_bucket < date_trunc('day', NOW() AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore'
    AND date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') NOT IN (
      SELECT date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') 
      FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day'
    )
  GROUP BY date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore'), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Step 5: Recreate aggregate_sensor_data_weekly with x/y/z (weighted avg from daily)
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_weekly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    avg_accel_x, avg_accel_y, avg_accel_z,
    avg_gyro_x, avg_gyro_y, avg_gyro_z,
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore',
    'week',
    COALESCE(location, 'Hangar'),
    SUM(avg_temperature * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_humidity * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pressure * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gas_resistance * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm1_0 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm2_5 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm10 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    MIN(min_temperature),
    MAX(max_temperature),
    SUM(data_points_count)::integer
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'day'
    AND date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') < date_trunc('week', NOW() AT TIME ZONE 'Asia/Singapore')
    AND date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') NOT IN (
      SELECT date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') 
      FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week'
    )
  GROUP BY date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore'), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Step 6: Recreate aggregate_sensor_data_monthly with x/y/z (weighted avg from weekly)
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_monthly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    avg_accel_x, avg_accel_y, avg_accel_z,
    avg_gyro_x, avg_gyro_y, avg_gyro_z,
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore',
    'month',
    COALESCE(location, 'Hangar'),
    SUM(avg_temperature * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_humidity * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pressure * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gas_resistance * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm1_0 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm2_5 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm10 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_x * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_y * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_z * data_points_count) / NULLIF(SUM(data_points_count), 0),
    MIN(min_temperature),
    MAX(max_temperature),
    SUM(data_points_count)::integer
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'week'
    AND date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') < date_trunc('month', NOW() AT TIME ZONE 'Asia/Singapore')
    AND date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') NOT IN (
      SELECT date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') 
      FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month'
    )
  GROUP BY date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore'), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;
