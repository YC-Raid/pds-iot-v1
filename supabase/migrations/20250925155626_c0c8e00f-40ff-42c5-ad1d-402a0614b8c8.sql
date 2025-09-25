-- Clean up old mock aggregated data for the gap period Sept 11-17
DELETE FROM sensor_readings_aggregated 
WHERE time_bucket AT TIME ZONE 'Asia/Singapore' >= '2025-09-11' 
  AND time_bucket AT TIME ZONE 'Asia/Singapore' <= '2025-09-17';

-- Also clean up any other suspicious aggregated data with exactly 288 data points (typical mock data pattern)
DELETE FROM sensor_readings_aggregated 
WHERE data_points_count = 288 
  AND time_bucket AT TIME ZONE 'Asia/Singapore' >= '2025-08-01';