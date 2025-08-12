-- Cost model migration (A)
-- 1) Extend maintenance_tasks with cost fields and a generated total_cost
ALTER TABLE public.maintenance_tasks
ADD COLUMN IF NOT EXISTS labor_hours numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_rate numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS parts_cost numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_cost numeric NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='maintenance_tasks' AND column_name='total_cost'
  ) THEN
    ALTER TABLE public.maintenance_tasks
    ADD COLUMN total_cost numeric GENERATED ALWAYS AS (
      COALESCE(labor_hours,0) * COALESCE(labor_rate,0)
      + COALESCE(parts_cost,0)
      + COALESCE(other_cost,0)
    ) STORED;
  END IF;
END $$;

-- Ensure non-negative costs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='maintenance_tasks' AND constraint_name='maintenance_tasks_cost_nonnegative'
  ) THEN
    ALTER TABLE public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_cost_nonnegative CHECK (
      labor_hours >= 0 AND labor_rate >= 0 AND parts_cost >= 0 AND other_cost >= 0
    );
  END IF;
END $$;

-- 2) Add cost field to alerts for incident-level costing
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0;

-- 3) Helpful indexes for time-bound analytics
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_completed_at ON public.maintenance_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);

-- 4) Auto-update updated_at on changes (uses existing function public.update_updated_at_column)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_maintenance_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_maintenance_tasks_updated_at
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_alerts_updated_at'
  ) THEN
    CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;