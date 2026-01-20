-- Clean up old notifications with threshold 10 (created before threshold was updated to 30)
DELETE FROM public.notifications
WHERE message LIKE '%threshold: 10%';

-- Also clean up any old alerts with threshold 10 that don't have user_id set
DELETE FROM public.alerts
WHERE threshold = '10'
AND user_id IS NULL;