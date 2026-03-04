-- 1. Create 1-minute aggregation function
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_1min()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('minute', recorded_at),
    '1min',
    COALESCE(location, 'Hangar'),
    AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance),
    AVG(pm1_0::real), AVG(pm2_5::real), AVG(pm10::real),
    AVG(accel_magnitude), AVG(gyro_magnitude),
    MIN(temperature), MAX(temperature),
    COUNT(*)::integer
  FROM public.processed_sensor_readings
  WHERE recorded_at >= NOW() - INTERVAL '14 days'
    AND date_trunc('minute', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = '1min'
    )
  GROUP BY date_trunc('minute', recorded_at), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$$;

-- 2. Update cleanup with tiered retention
CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_data()
RETURNS TABLE(deleted_readings integer, deleted_alerts integer, deleted_notifications integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  readings_deleted INTEGER := 0;
  alerts_deleted INTEGER := 0;
  notifs_deleted INTEGER := 0;
BEGIN
  -- CRITICAL: Run ALL aggregations BEFORE deleting raw data
  PERFORM public.aggregate_sensor_data_1min();
  PERFORM public.aggregate_sensor_data_hourly();
  PERFORM public.aggregate_sensor_data_daily();
  PERFORM public.aggregate_sensor_data_weekly();
  PERFORM public.aggregate_sensor_data_monthly();

  -- Tiered retention:
  -- Raw 10s data: 2 days (real-time dashboards, 1h/24h charts)
  -- 1-min aggregations: 14 days (7-day charts)
  -- Hourly aggregations: 90 days (30-day charts)
  -- Daily/weekly/monthly: indefinite (long-term trends)
  
  DELETE FROM public.processed_sensor_readings 
  WHERE recorded_at < NOW() - INTERVAL '2 days';
  GET DIAGNOSTICS readings_deleted = ROW_COUNT;
  
  DELETE FROM public.sensor_readings_aggregated 
  WHERE aggregation_level = '1min' AND time_bucket < NOW() - INTERVAL '14 days';
  
  DELETE FROM public.sensor_readings_aggregated 
  WHERE aggregation_level = 'hour' AND time_bucket < NOW() - INTERVAL '90 days';

  DELETE FROM public.alerts WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS alerts_deleted = ROW_COUNT;
  
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
     OR (is_read = true AND created_at < NOW() - INTERVAL '7 days');
  GET DIAGNOSTICS notifs_deleted = ROW_COUNT;
  
  deleted_readings := readings_deleted;
  deleted_alerts := alerts_deleted;
  deleted_notifications := notifs_deleted;
  RETURN NEXT;
END;
$$;

-- 3. Update run_all_sensor_aggregations to include 1-min
CREATE OR REPLACE FUNCTION public.run_all_sensor_aggregations()
RETURNS TABLE(hourly_count integer, daily_count integer, weekly_count integer, monthly_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  h_count integer; d_count integer; w_count integer; m_count integer;
BEGIN
  SELECT COUNT(*) INTO h_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour';
  SELECT COUNT(*) INTO d_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day';
  SELECT COUNT(*) INTO w_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week';
  SELECT COUNT(*) INTO m_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month';
  
  PERFORM public.aggregate_sensor_data_1min();
  PERFORM public.aggregate_sensor_data_hourly();
  PERFORM public.aggregate_sensor_data_daily();
  PERFORM public.aggregate_sensor_data_weekly();
  PERFORM public.aggregate_sensor_data_monthly();
  
  SELECT COUNT(*) - h_count INTO hourly_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour';
  SELECT COUNT(*) - d_count INTO daily_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day';
  SELECT COUNT(*) - w_count INTO weekly_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week';
  SELECT COUNT(*) - m_count INTO monthly_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month';
  RETURN NEXT;
END;
$$;

-- 4. Extend hourly aggregation lookback to 3 days
CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_hourly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (
    time_bucket, aggregation_level, location,
    avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance,
    avg_pm1_0, avg_pm2_5, avg_pm10,
    avg_accel_magnitude, avg_gyro_magnitude,
    min_temperature, max_temperature, data_points_count
  )
  SELECT date_trunc('hour', recorded_at), 'hour', location,
    AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance),
    AVG(pm1_0), AVG(pm2_5), AVG(pm10),
    AVG(accel_magnitude), AVG(gyro_magnitude),
    MIN(temperature), MAX(temperature), COUNT(*)
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() - INTERVAL '3 days'
    AND date_trunc('hour', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour'
    )
  GROUP BY date_trunc('hour', recorded_at), location
  ON CONFLICT DO NOTHING;
END;
$$;