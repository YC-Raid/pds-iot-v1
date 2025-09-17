import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateUptimeMetrics,
  calculateDegradationRate,
  calculateMaintenanceEfficiency,
  calculateComponentLifespan,
  calculatePredictedRemainingLife,
  type UptimeMetrics,
  type LongevityMetrics,
  type ComponentLifespan
} from '@/utils/longevityCalculations';
import { subMonths, format, differenceInDays } from 'date-fns';

interface MonthlyUptimeData {
  month: string;
  uptime: number;
  downtime: number;
  incidents: number;
}

export interface LongevityData {
  currentUptime: UptimeMetrics;
  longevityMetrics: LongevityMetrics;
  componentLifespan: ComponentLifespan[];
  monthlyUptimeData: MonthlyUptimeData[];
  isLoading: boolean;
  error: string | null;
}

export const useLongevityMetrics = () => {
  const [data, setData] = useState<LongevityData>({
    currentUptime: { uptime: 0, downtime: 0, totalDowntimeHours: 0, incidents: 0 },
    longevityMetrics: {
      expectedLifespan: 1,
      currentAge: 0,
      degradationRate: 2.5,
      predictedRemainingLife: 1,
      maintenanceEfficiency: 85,
      costEfficiency: 90
    },
    componentLifespan: [],
    monthlyUptimeData: [],
    isLoading: true,
    error: null
  });

  const fetchLongevityData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch sensor readings for the last 6 months
      const sixMonthsAgo = subMonths(new Date(), 6);
      const { data: sensorReadings, error: sensorError } = await supabase
        .from('processed_sensor_readings')
        .select('recorded_at, quality_score, anomaly_score, temperature, humidity, pressure, accel_magnitude, gyro_magnitude')
        .gte('recorded_at', sixMonthsAgo.toISOString())
        .order('recorded_at', { ascending: true });

      if (sensorError) throw sensorError;

      // Fetch maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('status, due_date, completed_at, task_type, created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (maintenanceError) throw maintenanceError;

      // Fetch alerts for component health calculation
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('sensor, severity, created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (alertsError) throw alertsError;

      // Calculate current uptime (last 30 days)
      const currentUptime = calculateUptimeMetrics(sensorReadings || [], 30);

      // Calculate degradation rate
      const degradationRate = calculateDegradationRate(sensorReadings || []);

      // Calculate maintenance efficiency
      const { efficiency, costEfficiency } = calculateMaintenanceEfficiency(maintenanceTasks || []);

      // Calculate component lifespan
      const componentLifespan = calculateComponentLifespan(sensorReadings || [], alerts || []);

      // Calculate system age from August 1, 2025
      const systemStartDate = new Date(2025, 7, 1); // August 1, 2025 (month is 0-indexed)
      const currentDate = new Date();
      const daysSinceStart = differenceInDays(currentDate, systemStartDate);
      const currentAge = Math.max(0, daysSinceStart / 365.25); // Convert days to years
      
      // Set expected lifespan to 1 year
      const expectedLifespan = 1;
      const predictedRemainingLife = calculatePredictedRemainingLife(
        currentAge,
        expectedLifespan,
        degradationRate,
        efficiency
      );

      // Calculate monthly uptime data for the chart
      const monthlyUptimeData: MonthlyUptimeData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = subMonths(new Date(), i + 1);
        const monthEnd = subMonths(new Date(), i);
        
        const monthReadings = (sensorReadings || []).filter(reading => {
          const readingDate = new Date(reading.recorded_at);
          return readingDate >= monthStart && readingDate < monthEnd;
        });

        const monthMetrics = calculateUptimeMetrics(monthReadings, 30);
        
        monthlyUptimeData.push({
          month: format(monthStart, 'MMM'),
          uptime: monthMetrics.uptime,
          downtime: monthMetrics.downtime,
          incidents: monthMetrics.incidents
        });
      }

      const longevityMetrics: LongevityMetrics = {
        expectedLifespan,
        currentAge,
        degradationRate,
        predictedRemainingLife,
        maintenanceEfficiency: efficiency,
        costEfficiency
      };

      setData({
        currentUptime,
        longevityMetrics,
        componentLifespan,
        monthlyUptimeData,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching longevity data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch longevity data'
      }));
    }
  };

  // Set up real-time subscription for sensor readings
  useEffect(() => {
    // Initial fetch
    fetchLongevityData();

    // Set up real-time subscription
    const channel = supabase
      .channel('longevity-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processed_sensor_readings'
        },
        () => {
          // Debounce updates to avoid too frequent recalculations
          setTimeout(fetchLongevityData, 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_tasks'
        },
        () => {
          setTimeout(fetchLongevityData, 2000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          setTimeout(fetchLongevityData, 3000);
        }
      )
      .subscribe();

    // Refresh data every 10 minutes
    const interval = setInterval(fetchLongevityData, 10 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return data;
};