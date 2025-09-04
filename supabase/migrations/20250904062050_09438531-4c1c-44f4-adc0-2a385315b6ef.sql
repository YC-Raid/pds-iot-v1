-- Create function to aggregate sensor data by week
CREATE OR REPLACE FUNCTION aggregate_sensor_data_weekly()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    date_trunc('week', recorded_at) as time_bucket,
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
  WHERE recorded_at >= NOW() - INTERVAL '3 months'
    AND date_trunc('week', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'week'
    )
  GROUP BY date_trunc('week', recorded_at), location
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create function to aggregate sensor data by month
CREATE OR REPLACE FUNCTION aggregate_sensor_data_monthly()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    date_trunc('month', recorded_at) as time_bucket,
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
  WHERE recorded_at >= NOW() - INTERVAL '1 year'
    AND date_trunc('month', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'month'
    )
  GROUP BY date_trunc('month', recorded_at), location
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create a consolidated function to run all aggregations
CREATE OR REPLACE FUNCTION run_all_sensor_aggregations()
RETURNS TABLE(
  hourly_count integer,
  daily_count integer, 
  weekly_count integer,
  monthly_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  h_count integer;
  d_count integer;
  w_count integer;
  m_count integer;
BEGIN
  -- Get counts before aggregation
  SELECT COUNT(*) INTO h_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour';
  SELECT COUNT(*) INTO d_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day';
  SELECT COUNT(*) INTO w_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week';
  SELECT COUNT(*) INTO m_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month';
  
  -- Run all aggregations
  PERFORM aggregate_sensor_data_hourly();
  PERFORM aggregate_sensor_data_daily();
  PERFORM aggregate_sensor_data_weekly();
  PERFORM aggregate_sensor_data_monthly();
  
  -- Get counts after aggregation and return the difference
  SELECT COUNT(*) - h_count INTO hourly_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'hour';
  SELECT COUNT(*) - d_count INTO daily_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'day';
  SELECT COUNT(*) - w_count INTO weekly_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'week';
  SELECT COUNT(*) - m_count INTO monthly_count FROM public.sensor_readings_aggregated WHERE aggregation_level = 'month';
  
  RETURN NEXT;
END;
$$;