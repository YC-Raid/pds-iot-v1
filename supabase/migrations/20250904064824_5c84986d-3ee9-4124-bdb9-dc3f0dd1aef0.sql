-- Update aggregation functions to use Asia/Singapore timezone

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_daily()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket,
    aggregation_level,
    location,
    avg_temperature,
    avg_humidity,
    avg_pressure,
    avg_gas_resistance,
    avg_pm1_0,
    avg_pm2_5,
    avg_pm10,
    avg_accel_magnitude,
    avg_gyro_magnitude,
    min_temperature,
    max_temperature,
    data_points_count
  )
  SELECT 
    date_trunc('day', recorded_at AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' as time_bucket,
    'day' as aggregation_level,
    location,
    AVG(temperature) as avg_temperature,
    AVG(humidity) as avg_humidity,
    AVG(pressure) as avg_pressure,
    AVG(gas_resistance) as avg_gas_resistance,
    AVG(pm1_0) as avg_pm1_0,
    AVG(pm2_5) as avg_pm2_5,
    AVG(pm10) as avg_pm10,
    AVG(accel_magnitude) as avg_accel_magnitude,
    AVG(gyro_magnitude) as avg_gyro_magnitude,
    MIN(temperature) as min_temperature,
    MAX(temperature) as max_temperature,
    COUNT(*) as data_points_count
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '1 month'
    AND date_trunc('day', recorded_at AT TIME ZONE 'Asia/Singapore') NOT IN (
      SELECT date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'day'
    )
  GROUP BY date_trunc('day', recorded_at AT TIME ZONE 'Asia/Singapore'), location
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_weekly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket,
    aggregation_level,
    location,
    avg_temperature,
    avg_humidity,
    avg_pressure,
    avg_gas_resistance,
    avg_pm1_0,
    avg_pm2_5,
    avg_pm10,
    avg_accel_magnitude,
    avg_gyro_magnitude,
    min_temperature,
    max_temperature,
    data_points_count
  )
  SELECT 
    date_trunc('week', recorded_at AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' as time_bucket,
    'week' as aggregation_level,
    location,
    AVG(temperature) as avg_temperature,
    AVG(humidity) as avg_humidity,
    AVG(pressure) as avg_pressure,
    AVG(gas_resistance) as avg_gas_resistance,
    AVG(pm1_0) as avg_pm1_0,
    AVG(pm2_5) as avg_pm2_5,
    AVG(pm10) as avg_pm10,
    AVG(accel_magnitude) as avg_accel_magnitude,
    AVG(gyro_magnitude) as avg_gyro_magnitude,
    MIN(temperature) as min_temperature,
    MAX(temperature) as max_temperature,
    COUNT(*) as data_points_count
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '3 months'
    AND date_trunc('week', recorded_at AT TIME ZONE 'Asia/Singapore') NOT IN (
      SELECT date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'week'
    )
  GROUP BY date_trunc('week', recorded_at AT TIME ZONE 'Asia/Singapore'), location
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_monthly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket,
    aggregation_level,
    location,
    avg_temperature,
    avg_humidity,
    avg_pressure,
    avg_gas_resistance,
    avg_pm1_0,
    avg_pm2_5,
    avg_pm10,
    avg_accel_magnitude,
    avg_gyro_magnitude,
    min_temperature,
    max_temperature,
    data_points_count
  )
  SELECT 
    date_trunc('month', recorded_at AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' as time_bucket,
    'month' as aggregation_level,
    location,
    AVG(temperature) as avg_temperature,
    AVG(humidity) as avg_humidity,
    AVG(pressure) as avg_pressure,
    AVG(gas_resistance) as avg_gas_resistance,
    AVG(pm1_0) as avg_pm1_0,
    AVG(pm2_5) as avg_pm2_5,
    AVG(pm10) as avg_pm10,
    AVG(accel_magnitude) as avg_accel_magnitude,
    AVG(gyro_magnitude) as avg_gyro_magnitude,
    MIN(temperature) as min_temperature,
    MAX(temperature) as max_temperature,
    COUNT(*) as data_points_count
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '1 year'
    AND date_trunc('month', recorded_at AT TIME ZONE 'Asia/Singapore') NOT IN (
      SELECT date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'month'
    )
  GROUP BY date_trunc('month', recorded_at AT TIME ZONE 'Asia/Singapore'), location
  ON CONFLICT DO NOTHING;
END;
$function$;