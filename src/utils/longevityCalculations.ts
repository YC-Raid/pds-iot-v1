import { subDays, differenceInHours, differenceInMinutes } from 'date-fns';

export interface UptimeMetrics {
  uptime: number;
  downtime: number;
  totalDowntimeHours: number;
  incidents: number;
}

export interface ComponentLifespan {
  component: string;
  current: number;
  expected: number;
  health: number;
}

export interface LongevityMetrics {
  expectedLifespan: number;
  currentAge: number;
  degradationRate: number;
  predictedRemainingLife: number;
  maintenanceEfficiency: number;
  costEfficiency: number;
}

// Calculate uptime/downtime from sensor readings
export function calculateUptimeMetrics(
  sensorReadings: Array<{ recorded_at: string; quality_score?: number }>,
  periodDays: number = 30
): UptimeMetrics {
  if (!sensorReadings || sensorReadings.length === 0) {
    return { uptime: 0, downtime: 100, totalDowntimeHours: 0, incidents: 0 };
  }

  const now = new Date();
  const periodStart = subDays(now, periodDays);
  const totalPeriodHours = periodDays * 24;

  // Filter readings within the period
  const readings = sensorReadings.filter(
    reading => new Date(reading.recorded_at) >= periodStart
  );

  if (readings.length === 0) {
    return { uptime: 0, downtime: 100, totalDowntimeHours: totalPeriodHours, incidents: 0 };
  }

  // Sort readings by time
  readings.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  let totalDowntimeMinutes = 0;
  let incidents = 0;
  const maxGapMinutes = 15; // Consider system down if gap > 15 minutes

  for (let i = 1; i < readings.length; i++) {
    const currentTime = new Date(readings[i].recorded_at);
    const previousTime = new Date(readings[i - 1].recorded_at);
    const gapMinutes = differenceInMinutes(currentTime, previousTime);

    if (gapMinutes > maxGapMinutes) {
      totalDowntimeMinutes += gapMinutes - maxGapMinutes;
      incidents++;
    }
  }

  // Check if there's a gap from the last reading to now
  const lastReading = readings[readings.length - 1];
  const gapFromLastReading = differenceInMinutes(now, new Date(lastReading.recorded_at));
  if (gapFromLastReading > maxGapMinutes) {
    totalDowntimeMinutes += gapFromLastReading - maxGapMinutes;
    incidents++;
  }

  const totalDowntimeHours = totalDowntimeMinutes / 60;
  const uptime = Math.max(0, ((totalPeriodHours - totalDowntimeHours) / totalPeriodHours) * 100);
  const downtime = 100 - uptime;

  return {
    uptime: Math.round(uptime * 10) / 10,
    downtime: Math.round(downtime * 10) / 10,
    totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10,
    incidents
  };
}

// Calculate degradation rate from sensor performance trends
export function calculateDegradationRate(
  sensorReadings: Array<{ 
    recorded_at: string; 
    quality_score?: number;
    anomaly_score?: number;
  }>
): number {
  if (!sensorReadings || sensorReadings.length < 100) {
    return 2.5; // Default degradation rate
  }

  // Group readings by month and calculate average quality
  const monthlyQuality: { [key: string]: number[] } = {};
  
  sensorReadings.forEach(reading => {
    const date = new Date(reading.recorded_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const quality = reading.quality_score || (100 - (reading.anomaly_score || 0) * 10);
    
    if (!monthlyQuality[monthKey]) {
      monthlyQuality[monthKey] = [];
    }
    monthlyQuality[monthKey].push(quality);
  });

  const monthlyAverages = Object.entries(monthlyQuality)
    .map(([month, qualities]) => ({
      month,
      avgQuality: qualities.reduce((sum, q) => sum + q, 0) / qualities.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (monthlyAverages.length < 3) {
    return 2.3; // Default if insufficient data
  }

  // Calculate trend - quality decline per month
  const firstThreeMonths = monthlyAverages.slice(0, 3);
  const lastThreeMonths = monthlyAverages.slice(-3);
  
  const initialQuality = firstThreeMonths.reduce((sum, m) => sum + m.avgQuality, 0) / firstThreeMonths.length;
  const currentQuality = lastThreeMonths.reduce((sum, m) => sum + m.avgQuality, 0) / lastThreeMonths.length;
  
  const monthsSpan = monthlyAverages.length;
  const totalDecline = initialQuality - currentQuality;
  const monthlyDecline = totalDecline / monthsSpan;
  const yearlyDecline = Math.max(0, monthlyDecline * 12);
  
  // Convert quality decline to degradation rate (inverse relationship)
  const degradationRate = Math.min(10, Math.max(0.5, yearlyDecline / 10));
  
  return Math.round(degradationRate * 10) / 10;
}

// Calculate maintenance efficiency from sensor data anomalies and maintenance tasks
export function calculateMaintenanceEfficiency(
  maintenanceTasks: Array<{
    status: string;
    due_date: string;
    completed_at?: string;
    task_type: string;
  }>,
  sensorReadings?: Array<{ 
    recorded_at: string; 
    anomaly_score?: number;
    quality_score?: number;
  }>
): { efficiency: number; costEfficiency: number } {
  let efficiency = 75; // Base efficiency
  let costEfficiency = 80; // Base cost efficiency

  // Factor 1: Sensor-based efficiency (60% weight)
  if (sensorReadings && sensorReadings.length > 0) {
    const recentReadings = sensorReadings.slice(-1000); // Last 1000 readings
    
    // Calculate anomaly rate (higher anomalies = lower efficiency)
    const anomalyCount = recentReadings.filter(reading => 
      (reading.anomaly_score || 0) > 0.3
    ).length;
    const anomalyRate = anomalyCount / recentReadings.length;
    
    // Calculate average quality score
    const avgQualityScore = recentReadings.reduce((sum, reading) => 
      sum + (reading.quality_score || 100), 0
    ) / recentReadings.length;
    
    // Efficiency based on sensor health (25-95% range)
    const sensorEfficiency = Math.max(25, Math.min(95, 
      avgQualityScore - (anomalyRate * 50)
    ));
    
    efficiency = Math.round(efficiency * 0.4 + sensorEfficiency * 0.6);
  }

  // Factor 2: Maintenance task performance (40% weight if tasks exist)
  if (maintenanceTasks && maintenanceTasks.length > 0) {
    const completedTasks = maintenanceTasks.filter(task => task.status === 'completed');
    const overdueTasks = maintenanceTasks.filter(task => {
      if (task.status !== 'completed') {
        return new Date(task.due_date) < new Date();
      }
      return false;
    });

    const onTimeTasks = completedTasks.filter(task => {
      if (!task.completed_at) return false;
      return new Date(task.completed_at) <= new Date(task.due_date);
    });

    const preventiveTasks = maintenanceTasks.filter(task => 
      task.task_type === 'preventive' || task.task_type === 'routine'
    );
    
    const taskEfficiency = Math.round((onTimeTasks.length / Math.max(1, maintenanceTasks.length)) * 100);
    
    // Blend sensor efficiency with task efficiency
    efficiency = Math.round(efficiency * 0.6 + taskEfficiency * 0.4);
    
    // Cost efficiency based on preventive vs corrective maintenance ratio
    const preventiveRatio = preventiveTasks.length / Math.max(1, maintenanceTasks.length);
    costEfficiency = Math.round(Math.min(100, 60 + (preventiveRatio * 40)));
  }

  return {
    efficiency: Math.max(25, Math.min(100, efficiency)), // Minimum 25% safety net
    costEfficiency: Math.max(25, Math.min(100, costEfficiency))
  };
}

// Calculate component lifespan and health
export function calculateComponentLifespan(
  sensorReadings: Array<{ 
    recorded_at: string; 
    temperature?: number;
    humidity?: number;
    pressure?: number;
    accel_magnitude?: number;
    gyro_magnitude?: number;
  }>,
  alerts: Array<{ sensor: string; severity: string; created_at: string }>
): ComponentLifespan[] {
  const baseComponents = [
    { component: "HVAC System", current: 5, expected: 15, baseHealth: 85 },
    { component: "Structural Steel", current: 8, expected: 50, baseHealth: 95 },
    { component: "Electrical Systems", current: 3, expected: 20, baseHealth: 90 },
    { component: "Sensors Network", current: 2, expected: 10, baseHealth: 88 },
    { component: "Door Mechanisms", current: 4, expected: 12, baseHealth: 75 },
  ];

  return baseComponents.map(component => {
    let healthModifier = 0;
    
    // Adjust health based on related alerts
    const componentAlerts = alerts.filter(alert => {
      const sensor = alert.sensor.toLowerCase();
      const comp = component.component.toLowerCase();
      
      if (comp.includes('hvac') && (sensor.includes('temperature') || sensor.includes('humidity'))) {
        return true;
      }
      if (comp.includes('structural') && sensor.includes('vibration')) {
        return true;
      }
      if (comp.includes('electrical') && sensor.includes('voltage')) {
        return true;
      }
      if (comp.includes('sensor') && sensor.includes('pm')) {
        return true;
      }
      return false;
    });

    // Reduce health based on critical alerts
    const criticalAlerts = componentAlerts.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    );
    healthModifier -= criticalAlerts.length * 5;

    // Adjust health based on sensor performance trends
    if (sensorReadings.length > 0) {
      const recentReadings = sensorReadings.slice(-100);
      const avgTemperature = recentReadings.reduce((sum, r) => sum + (r.temperature || 25), 0) / recentReadings.length;
      const avgVibration = recentReadings.reduce((sum, r) => sum + (r.accel_magnitude || 0), 0) / recentReadings.length;
      
      // Temperature stress
      if (avgTemperature > 35) healthModifier -= 10;
      if (avgTemperature < 10) healthModifier -= 5;
      
      // Vibration stress
      if (avgVibration > 2) healthModifier -= 15;
    }

    const finalHealth = Math.max(0, Math.min(100, component.baseHealth + healthModifier));
    
    return {
      component: component.component,
      current: component.current,
      expected: component.expected,
      health: Math.round(finalHealth)
    };
  });
}

// Calculate predicted remaining life with simplified logic for new systems
export function calculatePredictedRemainingLife(
  currentAge: number,
  expectedLifespan: number,
  degradationRate: number,
  maintenanceEfficiency: number,
  sensorReadings?: Array<{ anomaly_score?: number; quality_score?: number }>
): number {
  // Base remaining life
  const baseRemainingLife = expectedLifespan - currentAge;
  
  // For new systems (less than 6 months old), use simplified calculation
  if (currentAge < 0.5) {
    // Primary factor: anomaly-based adjustment for new systems
    if (sensorReadings && sensorReadings.length > 0) {
      const recentReadings = sensorReadings.slice(-500); // Last 500 readings
      
      // Calculate average anomaly score (0-1 scale)
      const avgAnomalyScore = recentReadings.reduce((sum, reading) => 
        sum + (reading.anomaly_score || 0), 0
      ) / recentReadings.length;
      
      // Calculate average quality score (0-100 scale)
      const avgQualityScore = recentReadings.reduce((sum, reading) => 
        sum + (reading.quality_score || 100), 0
      ) / recentReadings.length;
      
      // Anomaly adjustment: higher anomalies reduce remaining life
      // Scale: 0.7 (high anomalies) to 1.0 (no anomalies)
      const anomalyAdjustment = Math.max(0.7, 1 - (avgAnomalyScore * 0.3));
      
      // Quality adjustment: lower quality reduces remaining life
      // Scale: 0.8 (poor quality) to 1.0 (perfect quality)
      const qualityAdjustment = Math.max(0.8, avgQualityScore / 100);
      
      // Combine both adjustments
      const adjustedRemainingLife = baseRemainingLife * anomalyAdjustment * qualityAdjustment;
      
      return Math.max(0.1, Math.round(adjustedRemainingLife * 10) / 10);
    }
    
    // Fallback for new systems without sensor data: just use base remaining life
    return Math.max(0.1, Math.round(baseRemainingLife * 10) / 10);
  }
  
  // For mature systems (6+ months), use complex calculation with maintenance efficiency
  const degradationAdjustment = (5 - degradationRate) / 5;
  const maintenanceAdjustment = Math.max(0.3, maintenanceEfficiency / 100);
  const adjustedRemainingLife = baseRemainingLife * degradationAdjustment * maintenanceAdjustment;
  
  return Math.max(0, Math.round(adjustedRemainingLife * 10) / 10);
}