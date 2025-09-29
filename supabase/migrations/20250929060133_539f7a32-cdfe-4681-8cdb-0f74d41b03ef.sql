-- First, let's clean up the massive number of alerts created from mock data
DELETE FROM alerts 
WHERE created_at >= '2025-09-22' 
AND category IN ('environmental', 'equipment') 
AND status = 'active';

-- Also clean up any auto-generated alerts from the trigger
DELETE FROM alerts 
WHERE created_at >= '2025-09-18'
AND (
  description LIKE '%exceeds threshold%' 
  OR description LIKE '%vibration level detected%'
  OR title LIKE '%Alert'
);

-- Disable the automatic trigger that was creating alerts on every sensor reading
DROP TRIGGER IF EXISTS trigger_anomaly_detection_on_insert ON processed_sensor_readings;