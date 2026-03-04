
-- Fix FK constraint: set reading_id to NULL on delete instead of blocking
ALTER TABLE public.security_alert_log
  DROP CONSTRAINT security_alert_log_reading_id_fkey,
  ADD CONSTRAINT security_alert_log_reading_id_fkey 
    FOREIGN KEY (reading_id) REFERENCES public.processed_sensor_readings(id) 
    ON DELETE SET NULL;

-- Also fix ml_predictions FK
ALTER TABLE public.ml_predictions
  DROP CONSTRAINT ml_predictions_sensor_reading_id_fkey,
  ADD CONSTRAINT ml_predictions_sensor_reading_id_fkey
    FOREIGN KEY (sensor_reading_id) REFERENCES public.processed_sensor_readings(id)
    ON DELETE SET NULL;
