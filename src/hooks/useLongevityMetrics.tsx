import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
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
import { subMonths, format, differenceInDays, differenceInHours } from 'date-fns';

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

/**
 * Calculate uptime from hourly aggregated data.
 * Each hour with data = 1 hour uptime. Missing hours = downtime.
 * Consecutive missing hours = 1 incident.
 */
function calculateUptimeFromHourly(
  hourlyData: Array<{ time_bucket: string; data_points_count: number | null }>,
  periodStart: Date,
  periodEnd: Date
): UptimeMetrics {
  if (hourlyData.length === 0) {
    return { uptime: 0, downtime: 100, totalDowntimeHours: 0, incidents: 0 };
  }

  const totalHours = Math.max(1, differenceInHours(periodEnd, periodStart));
  
  // Create a set of hours that have data
  const activeHours = new Set(
    hourlyData.map(d => new Date(d.time_bucket).getTime())
  );

  let downtimeHours = 0;
  let incidents = 0;
  let inDowntime = false;

  // Walk through each hour in the period
  for (let h = 0; h < totalHours; h++) {
    const hourTime = new Date(periodStart.getTime() + h * 3600000).getTime();
    // Round to hour
    const roundedHour = new Date(hourTime);
    roundedHour.setMinutes(0, 0, 0);
    
    if (!activeHours.has(roundedHour.getTime())) {
      downtimeHours++;
      if (!inDowntime) {
        incidents++;
        inDowntime = true;
      }
    } else {
      inDowntime = false;
    }
  }

  const uptime = Math.max(0, ((totalHours - downtimeHours) / totalHours) * 100);
  const downtime = 100 - uptime;

  return {
    uptime: Math.round(uptime * 10) / 10,
    downtime: Math.round(downtime * 10) / 10,
    totalDowntimeHours: Math.round(downtimeHours * 10) / 10,
    incidents
  };
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

      const sixMonthsAgo = subMonths(new Date(), 6);
      const currentDate = new Date();

      // ── Fetch ALL data from the aggregated tables (tiny row counts) ──

      // Hourly aggregated data for uptime calculations (~180 rows)
      const { data: hourlyAggregated, error: hourlyError } = await supabase
        .from('sensor_readings_aggregated')
        .select('time_bucket, data_points_count, avg_temperature, avg_humidity, avg_pressure, avg_accel_magnitude, avg_gyro_magnitude, avg_pm2_5, avg_pm10')
        .eq('aggregation_level', 'hour')
        .gte('time_bucket', sixMonthsAgo.toISOString())
        .order('time_bucket', { ascending: true });

      if (hourlyError) throw hourlyError;

      // Daily aggregated data for trend calculations (~30 rows)
      const { data: dailyAggregated, error: dailyError } = await supabase
        .from('sensor_readings_aggregated')
        .select('time_bucket, data_points_count, avg_temperature, avg_humidity, avg_pressure, avg_accel_magnitude, avg_gyro_magnitude, avg_pm2_5, avg_pm10, min_temperature, max_temperature, avg_gas_resistance')
        .eq('aggregation_level', 'day')
        .gte('time_bucket', sixMonthsAgo.toISOString())
        .order('time_bucket', { ascending: true });

      if (dailyError) throw dailyError;

      // Fetch maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('status, due_date, completed_at, task_type, created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (maintenanceError) throw maintenanceError;

      // Fetch alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('sensor, severity, created_at, resolved_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (alertsError) throw alertsError;

      // ── Calculate current uptime (last 30 days) from hourly data ──
      const thirtyDaysAgo = subMonths(currentDate, 1);
      const recentHourly = (hourlyAggregated || []).filter(
        d => new Date(d.time_bucket) >= thirtyDaysAgo
      );
      const currentUptime = calculateUptimeFromHourly(recentHourly, thirtyDaysAgo, currentDate);

      // ── Build synthetic sensor readings from daily aggregated data ──
      // These are used by the existing calculation functions that expect sensor reading arrays
      const syntheticReadings = (dailyAggregated || []).map(d => ({
        recorded_at: d.time_bucket,
        temperature: d.avg_temperature,
        humidity: d.avg_humidity,
        pressure: d.avg_pressure,
        accel_magnitude: d.avg_accel_magnitude,
        gyro_magnitude: d.avg_gyro_magnitude,
        pm2_5: d.avg_pm2_5,
        pm10: d.avg_pm10,
        quality_score: null as number | null,
        anomaly_score: null as number | null,
      }));

      // Calculate degradation rate
      const degradationRate = calculateDegradationRate(syntheticReadings);

      // Calculate maintenance efficiency
      const { efficiency, costEfficiency } = calculateMaintenanceEfficiency(
        maintenanceTasks || [],
        syntheticReadings
      );

      // Calculate system age from August 1, 2025 in Asia/Singapore timezone
      const systemStartDate = new Date('2025-08-01T00:00:00+08:00');
      const daysSinceStart = differenceInDays(currentDate, systemStartDate);
      const currentAge = Math.max(0, daysSinceStart / 365.25);

      // Calculate component lifespan
      const componentLifespan = calculateComponentLifespan(syntheticReadings, alerts || [], currentAge);
      
      // Calculate predicted remaining life
      const expectedLifespan = 1;
      const predictedRemainingLife = calculatePredictedRemainingLife(
        currentAge,
        expectedLifespan,
        degradationRate,
        efficiency,
        syntheticReadings
      );

      // ── Calculate monthly uptime data from hourly aggregated ──
      const monthlyUptimeData: MonthlyUptimeData[] = [];
      let currentMonth = new Date(systemStartDate);
      
      while (currentMonth <= currentDate) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
        const actualMonthEnd = monthEnd > currentDate ? currentDate : monthEnd;

        const monthHourly = (hourlyAggregated || []).filter(d => {
          const dt = new Date(d.time_bucket);
          return dt >= monthStart && dt <= actualMonthEnd;
        });

        if (monthHourly.length > 0) {
          const monthMetrics = calculateUptimeFromHourly(monthHourly, monthStart, actualMonthEnd);
          monthlyUptimeData.push({
            month: format(monthStart, 'MMM yyyy'),
            uptime: monthMetrics.uptime,
            downtime: monthMetrics.downtime,
            incidents: monthMetrics.incidents
          });
        } else {
          monthlyUptimeData.push({
            month: format(monthStart, 'MMM yyyy'),
            uptime: 0,
            downtime: 100,
            incidents: 0
          });
        }
        
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        if (monthlyUptimeData.length >= 12) break;
      }

      // Calculate equipment wear and usage intensity
      const equipmentWear = calculateEquipmentWear(syntheticReadings, alerts || []);
      const usageIntensity = calculateUsageIntensity(
        syntheticReadings, 
        maintenanceTasks || [], 
        alerts || []
      );

      // Calculate longevity factors
      const environmentalConditions = calculateEnvironmentalConditions(syntheticReadings);
      const structuralIntegrity = calculateStructuralIntegrity(syntheticReadings);
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

      console.debug('Longevity Debug:', {
        currentAge: currentAge.toFixed(2),
        expectedLifespan,
        degradationRate,
        efficiency,
        predictedRemainingLife,
        hourlyDataPoints: (hourlyAggregated || []).length,
        dailyDataPoints: (dailyAggregated || []).length,
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

  useEffect(() => {
    fetchLongevityData();

    const channel = supabase
      .channel('longevity-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_readings_aggregated' },
        () => { setTimeout(fetchLongevityData, 5000); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_tasks' },
        () => { setTimeout(fetchLongevityData, 2000); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => { setTimeout(fetchLongevityData, 3000); }
      )
      .subscribe();

    const interval = setInterval(fetchLongevityData, 10 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return data;
};
