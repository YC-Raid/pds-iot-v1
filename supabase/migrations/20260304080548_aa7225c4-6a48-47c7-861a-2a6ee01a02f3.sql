
-- ============================================================
-- CASCADING TIERED AGGREGATION STRATEGY
-- Each tier aggregates FROM the previous tier, not from raw data.
-- After aggregation, the source tier rows are deleted.
-- ============================================================

-- 1. aggregate_sensor_data_1min: raw 10s → 1min (sources from processed_sensor_readings)
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
  WHERE recorded_at < date_trunc('minute', NOW())  -- only complete minutes
    AND date_trunc('minute', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = '1min'
    )
  GROUP BY date_trunc('minute', recorded_at), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- 2. aggregate_sensor_data_hourly: 1min → hourly (sources from 1min aggregated data)
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
    min_temperature, max_temperature, data_points_count
  )
  SELECT 
    date_trunc('hour', time_bucket),
    'hour',
    COALESCE(location, 'Hangar'),
    -- Weighted average using data_points_count
    SUM(avg_temperature * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_humidity * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pressure * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gas_resistance * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm1_0 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm2_5 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_pm10 * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_accel_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    SUM(avg_gyro_magnitude * data_points_count) / NULLIF(SUM(data_points_count), 0),
    MIN(min_temperature),
    MAX(max_temperature),
    SUM(data_points_count)::integer
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = '1min'
    AND time_bucket < date_trunc('hour', NOW())  -- only complete hours
    AND date_trunc('hour', time_bucket) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour'
    )
  GROUP BY date_trunc('hour', time_bucket), COALESCE(location, 'Hangar')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- 3. aggregate_sensor_data_daily: hourly → daily (sources from hourly)
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

-- 4. aggregate_sensor_data_weekly: daily → weekly (sources from daily)
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

-- 5. aggregate_sensor_data_monthly: weekly → monthly (sources from weekly)
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

-- 6. Updated cleanup: cascade delete after confirming next tier exists
CREATE OR REPLACE FUNCTION public.cleanup_old_sensor_data()
 RETURNS TABLE(deleted_readings integer, deleted_alerts integer, deleted_notifications integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  readings_deleted INTEGER := 0;
  alerts_deleted INTEGER := 0;
  notifs_deleted INTEGER := 0;
  tier_deleted INTEGER := 0;
BEGIN
  -- Step 1: Aggregate all tiers (cascade: raw→1min→hour→day→week→month)
  PERFORM public.aggregate_sensor_data_1min();
  PERFORM public.aggregate_sensor_data_hourly();
  PERFORM public.aggregate_sensor_data_daily();
  PERFORM public.aggregate_sensor_data_weekly();
  PERFORM public.aggregate_sensor_data_monthly();

  -- Step 2: Delete raw 10s data where 1min aggregation exists (keep last 2 min buffer)
  DELETE FROM public.processed_sensor_readings
  WHERE recorded_at < date_trunc('minute', NOW()) - INTERVAL '2 minutes'
    AND date_trunc('minute', recorded_at) IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = '1min'
    );
  GET DIAGNOSTICS readings_deleted = ROW_COUNT;

  -- Step 3: Delete 1min data where hourly aggregation exists (keep last 2 hour buffer)
  DELETE FROM public.sensor_readings_aggregated
  WHERE aggregation_level = '1min'
    AND time_bucket < date_trunc('hour', NOW()) - INTERVAL '2 hours'
    AND date_trunc('hour', time_bucket) IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour'
    );
  GET DIAGNOSTICS tier_deleted = ROW_COUNT;

  -- Step 4: Delete hourly data where daily aggregation exists (keep last 2 day buffer)
  DELETE FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'hour'
    AND time_bucket < date_trunc('day', NOW() AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' - INTERVAL '2 days'
    AND date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') IN (
      SELECT date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') 
      FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day'
    );

  -- Step 5: Delete daily data where weekly aggregation exists (keep last 2 week buffer)
  DELETE FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'day'
    AND time_bucket < date_trunc('week', NOW() AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' - INTERVAL '2 weeks'
    AND date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') IN (
      SELECT date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') 
      FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week'
    );

  -- Step 6: Delete weekly data where monthly aggregation exists (keep last 2 month buffer)
  DELETE FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'week'
    AND time_bucket < date_trunc('month', NOW() AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore' - INTERVAL '2 months'
    AND date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') IN (
      SELECT date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') 
      FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month'
    );

  -- Step 7: Clean alerts & notifications
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
$function$;

-- 7. Update run_all_sensor_aggregations to include 1min count
CREATE OR REPLACE FUNCTION public.run_all_sensor_aggregations()
 RETURNS TABLE(hourly_count integer, daily_count integer, weekly_count integer, monthly_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
