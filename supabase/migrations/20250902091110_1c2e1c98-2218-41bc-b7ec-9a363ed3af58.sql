-- Fix FDW user mapping to access AWS RDS data
-- Note: You'll need to provide your AWS RDS credentials
CREATE USER MAPPING IF NOT EXISTS FOR supabase_read_only_user
SERVER aws_rds
OPTIONS (user 'your_rds_username', password 'your_rds_password');

-- Create local Supabase tables to store transformed/processed data
-- This will be your secondary database for ML and processing

-- Enhanced sensor readings table for local processing
CREATE TABLE IF NOT EXISTS public.processed_sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  original_id INTEGER REFERENCES sensor_data(id),
  recorded_at TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT 'hangar_01',
  
  -- Environmental sensors
  temperature REAL,
  humidity REAL,
  pressure REAL,
  gas_resistance REAL,
  
  -- Air quality sensors
  pm1_0 INTEGER,
  pm2_5 INTEGER,
  pm10 INTEGER,
  
  -- Motion sensors (accelerometer)
  accel_x REAL,
  accel_y REAL,
  accel_z REAL,
  accel_magnitude REAL GENERATED ALWAYS AS (sqrt(accel_x^2 + accel_y^2 + accel_z^2)) STORED,
  
  -- Motion sensors (gyroscope)
  gyro_x REAL,
  gyro_y REAL,
  gyro_z REAL,
  gyro_magnitude REAL GENERATED ALWAYS AS (sqrt(gyro_x^2 + gyro_y^2 + gyro_z^2)) STORED,
  
  -- ML/Analytics fields
  anomaly_score REAL DEFAULT 0,
  predicted_failure_probability REAL DEFAULT 0,
  maintenance_recommendation TEXT,
  quality_score INTEGER DEFAULT 100, -- 0-100 scale
  
  -- Metadata
  processed_at TIMESTAMPTZ DEFAULT now(),
  processing_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_processed_sensor_recorded_at ON public.processed_sensor_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_processed_sensor_location ON public.processed_sensor_readings(location);
CREATE INDEX IF NOT EXISTS idx_processed_sensor_anomaly_score ON public.processed_sensor_readings(anomaly_score DESC);
CREATE INDEX IF NOT EXISTS idx_processed_sensor_failure_prob ON public.processed_sensor_readings(predicted_failure_probability DESC);

-- Create ML training datasets table
CREATE TABLE IF NOT EXISTS public.ml_training_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name TEXT NOT NULL,
  dataset_type TEXT NOT NULL, -- 'anomaly_detection', 'predictive_maintenance', etc.
  feature_columns TEXT[] NOT NULL,
  target_column TEXT,
  training_period_start TIMESTAMPTZ NOT NULL,
  training_period_end TIMESTAMPTZ NOT NULL,
  sample_count INTEGER DEFAULT 0,
  model_accuracy REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Create ML model predictions table
CREATE TABLE IF NOT EXISTS public.ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  sensor_reading_id BIGINT REFERENCES public.processed_sensor_readings(id),
  prediction_type TEXT NOT NULL, -- 'anomaly', 'maintenance', 'failure'
  prediction_value REAL NOT NULL,
  confidence_score REAL DEFAULT 0,
  prediction_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.processed_sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for processed sensor readings
CREATE POLICY "Users can view all processed sensor readings" ON public.processed_sensor_readings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert processed readings" ON public.processed_sensor_readings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update processed readings" ON public.processed_sensor_readings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for ML datasets
CREATE POLICY "Users can view all ML datasets" ON public.ml_training_datasets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage ML datasets" ON public.ml_training_datasets
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for ML predictions
CREATE POLICY "Users can view all ML predictions" ON public.ml_predictions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ML predictions" ON public.ml_predictions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to sync data from AWS RDS to local tables
CREATE OR REPLACE FUNCTION sync_sensor_data_from_rds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_count INTEGER := 0;
  max_local_id INTEGER := 0;
BEGIN
  -- Get the latest ID we've already processed
  SELECT COALESCE(MAX(original_id), 0) INTO max_local_id
  FROM processed_sensor_readings;
  
  -- Insert new records from FDW table
  INSERT INTO processed_sensor_readings (
    original_id,
    recorded_at,
    temperature,
    humidity,
    pressure,
    gas_resistance,
    pm1_0,
    pm2_5,
    pm10,
    accel_x,
    accel_y,
    accel_z,
    gyro_x,
    gyro_y,
    gyro_z
  )
  SELECT 
    sd.id,
    (sd.local_date + sd.local_time)::timestamptz AT TIME ZONE 'UTC',
    sd.temperature,
    sd.humidity,
    sd.pressure,
    sd.gas_resistance,
    sd.pm1_0,
    sd.pm2_5,
    sd.pm10,
    sd.accel_x,
    sd.accel_y,
    sd.accel_z,
    sd.gyro_x,
    sd.gyro_y,
    sd.gyro_z
  FROM sensor_data sd
  WHERE sd.id > max_local_id
  ORDER BY sd.id;
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN synced_count;
END;
$$;

-- Create trigger to update timestamps
CREATE TRIGGER update_processed_sensor_readings_updated_at
  BEFORE UPDATE ON public.processed_sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ml_datasets_updated_at
  BEFORE UPDATE ON public.ml_training_datasets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for real-time sensor dashboard
CREATE OR REPLACE VIEW sensor_dashboard_live AS
SELECT 
  location,
  COUNT(*) as total_readings,
  AVG(temperature) as avg_temperature,
  AVG(humidity) as avg_humidity,
  AVG(pressure) as avg_pressure,
  AVG(pm2_5) as avg_pm25,
  AVG(anomaly_score) as avg_anomaly_score,
  AVG(predicted_failure_probability) as avg_failure_risk,
  MAX(recorded_at) as last_reading,
  COUNT(*) FILTER (WHERE anomaly_score > 0.7) as high_anomaly_count,
  COUNT(*) FILTER (WHERE predicted_failure_probability > 0.6) as high_risk_count
FROM processed_sensor_readings
WHERE recorded_at >= NOW() - INTERVAL '24 hours'
GROUP BY location;