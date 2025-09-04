-- Fix security issues by setting search_path in functions
CREATE OR REPLACE FUNCTION aggregate_sensor_data_hourly()
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
    date_trunc('hour', recorded_at) as time_bucket,
    'hour' as aggregation_level,
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
  WHERE recorded_at >= NOW() - INTERVAL '24 hours'
    AND date_trunc('hour', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'hour'
    )
  GROUP BY date_trunc('hour', recorded_at), location
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION aggregate_sensor_data_daily()
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
    date_trunc('day', recorded_at) as time_bucket,
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
  WHERE recorded_at >= NOW() - INTERVAL '1 month'
    AND date_trunc('day', recorded_at) NOT IN (
      SELECT time_bucket FROM public.sensor_readings_aggregated 
      WHERE aggregation_level = 'day'
    )
  GROUP BY date_trunc('day', recorded_at), location
  ON CONFLICT DO NOTHING;
END;
$$;