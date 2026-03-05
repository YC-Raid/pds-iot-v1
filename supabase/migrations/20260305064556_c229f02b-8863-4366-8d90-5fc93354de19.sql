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
  latest_raw_at TIMESTAMP WITH TIME ZONE;
  latest_1min_bucket TIMESTAMP WITH TIME ZONE;
  latest_hour_bucket TIMESTAMP WITH TIME ZONE;
  raw_cutoff TIMESTAMP WITH TIME ZONE;
  minutely_cutoff TIMESTAMP WITH TIME ZONE;
  hourly_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Step 1: Aggregate all tiers (cascade: raw→1min→hour→day→week→month)
  PERFORM public.aggregate_sensor_data_1min();
  PERFORM public.aggregate_sensor_data_hourly();
  PERFORM public.aggregate_sensor_data_daily();
  PERFORM public.aggregate_sensor_data_weekly();
  PERFORM public.aggregate_sensor_data_monthly();

  -- Anchor retention windows to the latest available data, not wall-clock time.
  -- This preserves 1min/hour tiers when ingestion is temporarily stale.
  SELECT MAX(recorded_at) INTO latest_raw_at
  FROM public.processed_sensor_readings;

  SELECT MAX(time_bucket) INTO latest_1min_bucket
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = '1min';

  SELECT MAX(time_bucket) INTO latest_hour_bucket
  FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'hour';

  raw_cutoff := date_trunc('minute', COALESCE(latest_raw_at, NOW())) - INTERVAL '2 minutes';
  minutely_cutoff := date_trunc('hour', COALESCE(latest_1min_bucket, NOW())) - INTERVAL '2 hours';
  hourly_cutoff := (date_trunc('day', COALESCE(latest_hour_bucket, NOW()) AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore') - INTERVAL '2 days';

  -- Step 2: Delete raw 10s data where 1min aggregation exists (keep last 2 min buffer relative to latest raw data)
  DELETE FROM public.processed_sensor_readings
  WHERE recorded_at < raw_cutoff
    AND date_trunc('minute', recorded_at) IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = '1min'
    );
  GET DIAGNOSTICS readings_deleted = ROW_COUNT;

  -- Step 3: Delete 1min data where hourly aggregation exists (keep last 2 hour buffer relative to latest aggregated minute data)
  DELETE FROM public.sensor_readings_aggregated
  WHERE aggregation_level = '1min'
    AND time_bucket < minutely_cutoff
    AND date_trunc('hour', time_bucket) IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour'
    );
  GET DIAGNOSTICS tier_deleted = ROW_COUNT;

  -- Step 4: Delete hourly data where daily aggregation exists (keep last 2 day buffer relative to latest hourly data)
  DELETE FROM public.sensor_readings_aggregated
  WHERE aggregation_level = 'hour'
    AND time_bucket < hourly_cutoff
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