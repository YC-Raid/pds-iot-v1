-- Remove all existing dummy alert data to start fresh with real sensor-based alerts
DELETE FROM public.alert_notes;
DELETE FROM public.alerts;