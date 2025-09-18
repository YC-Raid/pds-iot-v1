-- Add support for additional alert statuses: in_progress and escalated
-- Update any existing alerts to use the new status format if needed
UPDATE alerts SET status = 'active' WHERE status NOT IN ('active', 'acknowledged', 'resolved', 'in_progress', 'escalated');

-- Add a comment to document the supported statuses
COMMENT ON COLUMN alerts.status IS 'Supported values: active, acknowledged, in_progress, escalated, resolved';