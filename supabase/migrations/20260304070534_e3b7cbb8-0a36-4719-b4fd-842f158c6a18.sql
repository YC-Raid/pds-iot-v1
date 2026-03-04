-- Standardize search_path to '' for all SECURITY DEFINER functions

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
  thirty_days_ago TIMESTAMPTZ;
BEGIN
  thirty_days_ago := (NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '30 days') AT TIME ZONE 'Asia/Singapore';
  DELETE FROM public.processed_sensor_readings WHERE recorded_at < thirty_days_ago;
  GET DIAGNOSTICS readings_deleted = ROW_COUNT;
  DELETE FROM public.alerts WHERE created_at < thirty_days_ago;
  GET DIAGNOSTICS alerts_deleted = ROW_COUNT;
  DELETE FROM public.notifications
  WHERE created_at < thirty_days_ago
     OR (is_read = true AND created_at < NOW() - INTERVAL '7 days');
  GET DIAGNOSTICS notifs_deleted = ROW_COUNT;
  deleted_readings := readings_deleted;
  deleted_alerts := alerts_deleted;
  deleted_notifications := notifs_deleted;
  RETURN NEXT;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_hourly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (time_bucket, aggregation_level, location, avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance, avg_pm1_0, avg_pm2_5, avg_pm10, avg_accel_magnitude, avg_gyro_magnitude, min_temperature, max_temperature, data_points_count)
  SELECT date_trunc('hour', recorded_at), 'hour', location, AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance), AVG(pm1_0), AVG(pm2_5), AVG(pm10), AVG(accel_magnitude), AVG(gyro_magnitude), MIN(temperature), MAX(temperature), COUNT(*)
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() - INTERVAL '24 hours'
    AND date_trunc('hour', recorded_at) NOT IN (SELECT time_bucket FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour')
  GROUP BY date_trunc('hour', recorded_at), location
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_daily()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (time_bucket, aggregation_level, location, avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance, avg_pm1_0, avg_pm2_5, avg_pm10, avg_accel_magnitude, avg_gyro_magnitude, min_temperature, max_temperature, data_points_count)
  SELECT date_trunc('day', recorded_at AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore', 'day', location, AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance), AVG(pm1_0), AVG(pm2_5), AVG(pm10), AVG(accel_magnitude), AVG(gyro_magnitude), MIN(temperature), MAX(temperature), COUNT(*)
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '1 month'
    AND date_trunc('day', recorded_at AT TIME ZONE 'Asia/Singapore') NOT IN (SELECT date_trunc('day', time_bucket AT TIME ZONE 'Asia/Singapore') FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day')
  GROUP BY date_trunc('day', recorded_at AT TIME ZONE 'Asia/Singapore'), location
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_weekly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (time_bucket, aggregation_level, location, avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance, avg_pm1_0, avg_pm2_5, avg_pm10, avg_accel_magnitude, avg_gyro_magnitude, min_temperature, max_temperature, data_points_count)
  SELECT date_trunc('week', recorded_at AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore', 'week', location, AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance), AVG(pm1_0), AVG(pm2_5), AVG(pm10), AVG(accel_magnitude), AVG(gyro_magnitude), MIN(temperature), MAX(temperature), COUNT(*)
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '3 months'
    AND date_trunc('week', recorded_at AT TIME ZONE 'Asia/Singapore') NOT IN (SELECT date_trunc('week', time_bucket AT TIME ZONE 'Asia/Singapore') FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week')
  GROUP BY date_trunc('week', recorded_at AT TIME ZONE 'Asia/Singapore'), location
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_sensor_data_monthly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.sensor_readings_aggregated (time_bucket, aggregation_level, location, avg_temperature, avg_humidity, avg_pressure, avg_gas_resistance, avg_pm1_0, avg_pm2_5, avg_pm10, avg_accel_magnitude, avg_gyro_magnitude, min_temperature, max_temperature, data_points_count)
  SELECT date_trunc('month', recorded_at AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore', 'month', location, AVG(temperature), AVG(humidity), AVG(pressure), AVG(gas_resistance), AVG(pm1_0), AVG(pm2_5), AVG(pm10), AVG(accel_magnitude), AVG(gyro_magnitude), MIN(temperature), MAX(temperature), COUNT(*)
  FROM public.processed_sensor_readings 
  WHERE recorded_at >= NOW() AT TIME ZONE 'Asia/Singapore' - INTERVAL '1 year'
    AND date_trunc('month', recorded_at AT TIME ZONE 'Asia/Singapore') NOT IN (SELECT date_trunc('month', time_bucket AT TIME ZONE 'Asia/Singapore') FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month')
  GROUP BY date_trunc('month', recorded_at AT TIME ZONE 'Asia/Singapore'), location
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nickname', 'User'));
  IF NEW.email = 'test1@gmail.com' THEN
    UPDATE public.user_roles SET role = 'admin'::public.app_role WHERE user_id = NEW.id;
    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role);
    END IF;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer'::public.app_role);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$function$;