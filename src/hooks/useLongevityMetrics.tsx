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
  calculateEnvironmentalConditions,
  calculateStructuralIntegrity,
  calculateMaintenanceQualityScore,
  type UptimeMetrics,
  type LongevityMetrics,
  type ComponentLifespan
} from '@/utils/longevityCalculations';
import { subMonths, format, differenceInDays, getDaysInMonth } from 'date-fns';

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
      usageIntensity: { level: 'Normal', score: 50 },
      environmentalConditions: { level: 'Good', score: 75 },
      structuralIntegrity: { level: 'Excellent', score: 90 },
      maintenanceQuality: { level: 'High', score: 78 },
    },
    componentLifespan: [],
    monthlyUptimeData: [],
    isLoading: true,
    error: null
  });

  const fetchLongevityData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch sensor readings — sample from each month to ensure coverage
      // With 60K+ rows per month, a single query can't cover all months
      // Strategy: fetch newest data first (most important for current metrics)
      // then backfill older months
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      // Fetch recent data first (last 30 days) for current uptime metrics
      const thirtyDaysAgo = subMonths(new Date(), 1);
      const { data: recentReadings, error: recentError } = await supabase
        .from('processed_sensor_readings')
        .select('recorded_at, quality_score, anomaly_score, temperature, humidity, pressure, accel_magnitude, gyro_magnitude, pm2_5, pm10')
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(15000);

      if (recentError) throw recentError;

      // Fetch older data for historical monthly trends
      const { data: olderReadings, error: olderError } = await supabase
        .from('processed_sensor_readings')
        .select('recorded_at, quality_score, anomaly_score, temperature, humidity, pressure, accel_magnitude, gyro_magnitude, pm2_5, pm10')
        .gte('recorded_at', sixMonthsAgo.toISOString())
        .lt('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: true })
        .limit(10000);

      if (olderError) throw olderError;

      // Combine all readings
      const sensorReadings = [...(olderReadings || []), ...(recentReadings || [])];

      // errors already handled above

      // Fetch maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('status, due_date, completed_at, task_type, created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (maintenanceError) throw maintenanceError;

      // Fetch alerts for component health calculation
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('sensor, severity, created_at, resolved_at')
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

      // Calculate system age from August 1, 2025 in Asia/Singapore timezone
      const systemStartDate = new Date('2025-08-01T00:00:00+08:00');
      const currentDate = new Date();
      const daysSinceStart = differenceInDays(currentDate, systemStartDate);
      const currentAge = Math.max(0, daysSinceStart / 365.25);

      // Calculate component lifespan (pass system age so it's not hardcoded)
      const componentLifespan = calculateComponentLifespan(sensorReadings || [], alerts || [], currentAge);
      
      // Set expected lifespan to 1 year
      const expectedLifespan = 1;
      const predictedRemainingLife = calculatePredictedRemainingLife(
        currentAge,
        expectedLifespan,
        degradationRate,
        efficiency,
        sensorReadings // Pass sensor readings for anomaly-based calculation
      );

      // Calculate monthly uptime data — show all months from system start
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

        if (monthReadings.length > 0) {
          const daysInThisMonth = Math.max(1, Math.round((actualMonthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
          const monthMetrics = calculateUptimeMetrics(monthReadings, daysInThisMonth, actualMonthEnd, monthStart);
          
          monthlyUptimeData.push({
            month: format(monthStart, 'MMM yyyy'),
            uptime: monthMetrics.uptime,
            downtime: monthMetrics.downtime,
            incidents: monthMetrics.incidents
          });
        } else {
          // Show 0% for months with no data
          monthlyUptimeData.push({
            month: format(monthStart, 'MMM yyyy'),
            uptime: 0,
            downtime: 100,
            incidents: 0
          });
        }
        
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

      // Calculate new longevity factors
      const environmentalConditions = calculateEnvironmentalConditions(sensorReadings || []);
      const structuralIntegrity = calculateStructuralIntegrity(sensorReadings || []);
      const maintenanceQuality = calculateMaintenanceQualityScore(alerts || [], maintenanceTasks || []);

      const longevityMetrics: LongevityMetrics = {
        expectedLifespan,
        currentAge,
        degradationRate,
        predictedRemainingLife,
        maintenanceEfficiency: efficiency,
        costEfficiency,
        equipmentWear,
        usageIntensity,
        environmentalConditions,
        structuralIntegrity,
        maintenanceQuality
      };

      // Debug logging
      console.debug('Longevity Debug:', {
        currentAge: currentAge.toFixed(2),
        expectedLifespan,
        degradationRate,
        efficiency,
        predictedRemainingLife,
        monthlyUptimeData: monthlyUptimeData.map(m => `${m.month}: ${m.uptime}%`),
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