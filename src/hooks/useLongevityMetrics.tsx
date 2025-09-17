import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateUptimeMetrics,
  calculateDegradationRate,
  calculateMaintenanceEfficiency,
  calculateComponentLifespan,
  calculatePredictedRemainingLife,
  calculateEquipmentWear,
  calculateUsageIntensity,
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
      costEfficiency: 90,
      equipmentWear: { level: 'Moderate', score: 50 },
      usageIntensity: { level: 'Normal', score: 50 }
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

      // Calculate maintenance efficiency using both tasks and sensor data
      const { efficiency, costEfficiency } = calculateMaintenanceEfficiency(
        maintenanceTasks || [],
        sensorReadings // Pass sensor readings for anomaly-based efficiency calculation
      );

      // Calculate component lifespan
      const componentLifespan = calculateComponentLifespan(sensorReadings || [], alerts || []);

      // Calculate system age from August 1, 2025 in Asia/Singapore timezone
      const systemStartDate = new Date('2025-08-01T00:00:00+08:00'); // August 1, 2025 in Singapore time
      const currentDate = new Date();
      const daysSinceStart = differenceInDays(currentDate, systemStartDate);
      const currentAge = Math.max(0, daysSinceStart / 365.25); // Convert days to years
      
      // Set expected lifespan to 1 year
      const expectedLifespan = 1;
      const predictedRemainingLife = calculatePredictedRemainingLife(
        currentAge,
        expectedLifespan,
        degradationRate,
        efficiency,
        sensorReadings // Pass sensor readings for anomaly-based calculation
      );

      // Calculate monthly uptime data starting from August 2025
      const monthlyUptimeData: MonthlyUptimeData[] = [];
      
      // Start from August 2025 and go up to current month
      let currentMonth = new Date(systemStartDate);
      
      while (currentMonth <= currentDate) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
        
        // If monthEnd is in the future, use current date as end
        const actualMonthEnd = monthEnd > currentDate ? currentDate : monthEnd;
        
        const monthReadings = (sensorReadings || []).filter(reading => {
          const readingDate = new Date(reading.recorded_at);
          return readingDate >= monthStart && readingDate <= actualMonthEnd;
        });

        const monthMetrics = calculateUptimeMetrics(monthReadings, 30);
        
        monthlyUptimeData.push({
          month: format(monthStart, 'MMM'),
          uptime: monthMetrics.uptime,
          downtime: monthMetrics.downtime,
          incidents: monthMetrics.incidents
        });
        
        // Move to next month
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        
        // Safety limit - don't show more than 12 months
        if (monthlyUptimeData.length >= 12) break;
      }

      // Calculate equipment wear and usage intensity
      const equipmentWear = calculateEquipmentWear(sensorReadings || [], alerts || []);
      const usageIntensity = calculateUsageIntensity(
        sensorReadings || [], 
        maintenanceTasks || [], 
        alerts || []
      );

      const longevityMetrics: LongevityMetrics = {
        expectedLifespan,
        currentAge,
        degradationRate,
        predictedRemainingLife,
        maintenanceEfficiency: efficiency,
        costEfficiency,
        equipmentWear,
        usageIntensity
      };

      // Debug logging for troubleshooting
      console.log('Longevity Debug:', {
        currentAge,
        expectedLifespan,
        degradationRate,
        efficiency,
        predictedRemainingLife,
        baseRemainingLife: expectedLifespan - currentAge
      });

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