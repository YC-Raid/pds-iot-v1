-- Create aggregated sensor readings table for better performance
CREATE TABLE IF NOT EXISTS public.sensor_readings_aggregated (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  aggregation_level TEXT NOT NULL, -- 'hour', 'day', 'week'
  location TEXT DEFAULT 'hangar_01',
  avg_temperature REAL,
  avg_humidity REAL,
  avg_pressure REAL,
  avg_gas_resistance REAL,
  avg_pm1_0 REAL,
  avg_pm2_5 REAL,
  avg_pm10 REAL,
  avg_accel_magnitude REAL,
  avg_gyro_magnitude REAL,
  min_temperature REAL,
  max_temperature REAL,
  data_points_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sensor_readings_aggregated ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing aggregated data
CREATE POLICY "Users can view aggregated sensor data" 
ON public.sensor_readings_aggregated 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_sensor_aggregated_time_level ON public.sensor_readings_aggregated(time_bucket, aggregation_level);

-- Create function to aggregate sensor data by hour
CREATE OR REPLACE FUNCTION aggregate_sensor_data_hourly()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to aggregate sensor data by day
CREATE OR REPLACE FUNCTION aggregate_sensor_data_daily()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;