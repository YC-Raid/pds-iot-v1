-- Harden function search_path to satisfy linter
CREATE OR REPLACE FUNCTION public.compute_maintenance_total_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.total_cost := COALESCE(NEW.labor_hours, 0)::numeric * COALESCE(NEW.labor_rate, 0)::numeric
                    + COALESCE(NEW.parts_cost, 0)::numeric
                    + COALESCE(NEW.other_cost, 0)::numeric;
  RETURN NEW;
END;
$function$;