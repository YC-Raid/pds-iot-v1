-- Add additional threshold columns to notification_settings for comprehensive sensor monitoring
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS alert_threshold_pressure_min numeric DEFAULT 1000,
ADD COLUMN IF NOT EXISTS alert_threshold_pressure_max numeric DEFAULT 1020,
ADD COLUMN IF NOT EXISTS alert_threshold_pm25 numeric DEFAULT 35,
ADD COLUMN IF NOT EXISTS alert_threshold_pm25_critical numeric DEFAULT 75,
ADD COLUMN IF NOT EXISTS alert_threshold_vibration numeric DEFAULT 10,
ADD COLUMN IF NOT EXISTS alert_threshold_anomaly_score numeric DEFAULT 0.6,
ADD COLUMN IF NOT EXISTS alert_threshold_failure_prob numeric DEFAULT 0.4,
ADD COLUMN IF NOT EXISTS alert_threshold_temp_min numeric DEFAULT 15;

-- Add comments for documentation
COMMENT ON COLUMN public.notification_settings.alert_threshold_pressure_min IS 'Minimum safe pressure threshold in hPa';
COMMENT ON COLUMN public.notification_settings.alert_threshold_pressure_max IS 'Maximum safe pressure threshold in hPa';
COMMENT ON COLUMN public.notification_settings.alert_threshold_pm25 IS 'Warning threshold for PM2.5 in μg/m³';
COMMENT ON COLUMN public.notification_settings.alert_threshold_pm25_critical IS 'Critical threshold for PM2.5 in μg/m³';
COMMENT ON COLUMN public.notification_settings.alert_threshold_vibration IS 'Vibration threshold in m/s²';
COMMENT ON COLUMN public.notification_settings.alert_threshold_anomaly_score IS 'Anomaly score warning threshold (0-1)';
COMMENT ON COLUMN public.notification_settings.alert_threshold_failure_prob IS 'Failure probability warning threshold (0-1)';
COMMENT ON COLUMN public.notification_settings.alert_threshold_temp_min IS 'Minimum safe temperature threshold in °C';