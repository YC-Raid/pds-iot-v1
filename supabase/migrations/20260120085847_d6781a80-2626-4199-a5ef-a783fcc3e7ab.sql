-- Backfill existing processed_sensor_readings with door security data from sensor_data
UPDATE processed_sensor_readings psr
SET 
  door_status = sd.door_status,
  door_opens = sd.door_opens,
  door_closes = sd.door_closes,
  intrusion_alert = sd.intrusion_alert
FROM sensor_data sd
WHERE psr.original_id = sd.id
  AND (sd.door_status IS NOT NULL OR sd.door_opens > 0 OR sd.door_closes > 0 OR sd.intrusion_alert = true);