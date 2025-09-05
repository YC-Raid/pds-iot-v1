-- Backfill processed_sensor_readings.recorded_at using Asia/Singapore local time from source sensor_data
-- and regenerate aggregates to reflect corrected timestamps

-- 1) Correct recorded_at for all existing rows based on source FDW table
UPDATE public.processed_sensor_readings ps
SET 
  recorded_at = (sd.local_date + sd.local_time) AT TIME ZONE 'Asia/Singapore',
  processing_version = 'v1.1-sgt'
FROM public.sensor_data sd
WHERE sd.id = ps.original_id
  AND ps.recorded_at IS DISTINCT FROM (sd.local_date + sd.local_time) AT TIME ZONE 'Asia/Singapore';

-- 2) Rebuild aggregates to ensure charts reflect corrected time buckets
TRUNCATE TABLE public.sensor_readings_aggregated;
SELECT public.aggregate_sensor_data_hourly();
SELECT public.aggregate_sensor_data_daily();
SELECT public.aggregate_sensor_data_weekly();
SELECT public.aggregate_sensor_data_monthly();