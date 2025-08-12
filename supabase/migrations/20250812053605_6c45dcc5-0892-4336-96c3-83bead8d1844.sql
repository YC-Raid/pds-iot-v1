-- Add cost fields to maintenance_tasks and cost to alerts with safe, idempotent operations
-- and create a trigger to auto-calculate total_cost

-- 1) Add columns to maintenance_tasks if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'maintenance_tasks' AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE public.maintenance_tasks
      ADD COLUMN labor_hours numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN labor_rate numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN parts_cost numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN other_cost numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN total_cost numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2) Create or replace function to compute total cost
CREATE OR REPLACE FUNCTION public.compute_maintenance_total_cost()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.labor_hours, 0)::numeric * COALESCE(NEW.labor_rate, 0)::numeric
                    + COALESCE(NEW.parts_cost, 0)::numeric
                    + COALESCE(NEW.other_cost, 0)::numeric;
  RETURN NEW;
END;
$$;

-- 3) Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_compute_maintenance_total_cost'
  ) THEN
    CREATE TRIGGER trg_compute_maintenance_total_cost
    BEFORE INSERT OR UPDATE OF labor_hours, labor_rate, parts_cost, other_cost
    ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.compute_maintenance_total_cost();
  END IF;
END $$;

-- 4) Helpful indexes (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_maintenance_tasks_total_cost'
  ) THEN
    CREATE INDEX idx_maintenance_tasks_total_cost ON public.maintenance_tasks (total_cost);
  END IF;
END $$;

-- 5) Add cost column to alerts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'alerts' AND column_name = 'cost'
  ) THEN
    ALTER TABLE public.alerts
      ADD COLUMN cost numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;
