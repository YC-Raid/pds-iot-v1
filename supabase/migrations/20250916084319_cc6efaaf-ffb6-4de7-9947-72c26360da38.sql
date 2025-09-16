-- Enable real-time updates for longevity-related tables
ALTER TABLE processed_sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE maintenance_tasks REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE processed_sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;