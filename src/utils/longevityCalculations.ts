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
  equipmentWear: {
    level: 'Low' | 'Moderate' | 'High' | 'Critical';
    score: number;
  };
  usageIntensity: {
    level: 'Low' | 'Normal' | 'High' | 'Very High';
    score: number;
  };
  environmentalConditions: {
    level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    score: number;
  };
  structuralIntegrity: {
    level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    score: number;
  };
  maintenanceQuality: {
    level: 'Excellent' | 'High' | 'Good' | 'Fair' | 'Poor';
    score: number;
  };
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

// Calculate equipment wear based on sensor data and alerts
export function calculateEquipmentWear(
  sensorReadings: Array<{
    accel_magnitude?: number;
    gyro_magnitude?: number;
    temperature?: number;
    humidity?: number;
    recorded_at: string;
  }>,
  alerts: Array<{ severity: string; sensor: string; created_at: string }>
): { level: 'Low' | 'Moderate' | 'High' | 'Critical'; score: number } {
  if (sensorReadings.length === 0) {
    return { level: 'Moderate', score: 50 };
  }

  let wearScore = 0;
  const recentReadings = sensorReadings.slice(-1000); // Last 1000 readings

  // Vibration impact (40% of score)
  const avgVibration = recentReadings.reduce((sum, r) => 
    sum + Math.sqrt((r.accel_magnitude || 0) ** 2 + (r.gyro_magnitude || 0) ** 2), 0
  ) / recentReadings.length;
  
  if (avgVibration > 3) wearScore += 40;
  else if (avgVibration > 2) wearScore += 30;
  else if (avgVibration > 1) wearScore += 20;
  else wearScore += 10;

  // Temperature stress (25% of score)
  const avgTemp = recentReadings.reduce((sum, r) => sum + (r.temperature || 25), 0) / recentReadings.length;
  const tempVariation = Math.max(...recentReadings.map(r => r.temperature || 25)) - 
                       Math.min(...recentReadings.map(r => r.temperature || 25));
  
  if (avgTemp > 35 || avgTemp < 10 || tempVariation > 20) wearScore += 25;
  else if (avgTemp > 30 || avgTemp < 15 || tempVariation > 15) wearScore += 15;
  else wearScore += 5;

  // Alert frequency (35% of score)
  const recentAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.created_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return alertDate > thirtyDaysAgo;
  });
  
  const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical').length;
  const highAlerts = recentAlerts.filter(a => a.severity === 'high').length;
  
  if (criticalAlerts > 5 || highAlerts > 10) wearScore += 35;
  else if (criticalAlerts > 2 || highAlerts > 5) wearScore += 25;
  else if (criticalAlerts > 0 || highAlerts > 2) wearScore += 15;
  else wearScore += 5;

  // Determine level based on score
  let level: 'Low' | 'Moderate' | 'High' | 'Critical';
  if (wearScore >= 80) level = 'Critical';
  else if (wearScore >= 60) level = 'High';
  else if (wearScore >= 40) level = 'Moderate';
  else level = 'Low';

  return { level, score: wearScore };
}

// Calculate usage intensity based on data patterns
export function calculateUsageIntensity(
  sensorReadings: Array<{ recorded_at: string }>,
  maintenanceTasks: Array<{ created_at: string; status: string }>,
  alerts: Array<{ created_at: string }>
): { level: 'Low' | 'Normal' | 'High' | 'Very High'; score: number } {
  if (sensorReadings.length === 0) {
    return { level: 'Normal', score: 50 };
  }

  let intensityScore = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Data collection frequency (40% of score)
  const recentReadings = sensorReadings.filter(r => new Date(r.recorded_at) > thirtyDaysAgo);
  const dailyAverage = recentReadings.length / 30;
  
  if (dailyAverage > 2000) intensityScore += 40;
  else if (dailyAverage > 1000) intensityScore += 30;
  else if (dailyAverage > 500) intensityScore += 20;
  else intensityScore += 10;

  // Maintenance activity (30% of score)
  const recentMaintenance = maintenanceTasks.filter(t => new Date(t.created_at) > thirtyDaysAgo);
  const completedMaintenance = recentMaintenance.filter(t => t.status === 'completed').length;
  
  if (completedMaintenance > 10) intensityScore += 30;
  else if (completedMaintenance > 5) intensityScore += 20;
  else if (completedMaintenance > 2) intensityScore += 15;
  else intensityScore += 5;

  // Alert generation (30% of score)
  const recentAlerts = alerts.filter(a => new Date(a.created_at) > thirtyDaysAgo);
  
  if (recentAlerts.length > 50) intensityScore += 30;
  else if (recentAlerts.length > 25) intensityScore += 20;
  else if (recentAlerts.length > 10) intensityScore += 15;
  else intensityScore += 5;

  // Determine level based on score
  let level: 'Low' | 'Normal' | 'High' | 'Very High';
  if (intensityScore >= 80) level = 'Very High';
  else if (intensityScore >= 60) level = 'High';
  else if (intensityScore >= 40) level = 'Normal';
  else level = 'Low';

  return { level, score: intensityScore };
}

// Calculate environmental conditions based on sensor data
export function calculateEnvironmentalConditions(
  sensorReadings: Array<{
    temperature?: number;
    humidity?: number;
    pm2_5?: number;
    pm10?: number;
    recorded_at: string;
  }>
): { level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'; score: number } {
  if (sensorReadings.length === 0) {
    return { level: 'Good', score: 75 };
  }

  const recentReadings = sensorReadings.slice(-200); // Last 200 readings
  let totalScore = 0;
  
  // Temperature stability (ideal range 20-28°C) - 35% weight
  const tempReadings = recentReadings.filter(r => r.temperature != null);
  let tempScore = 20;
  if (tempReadings.length > 0) {
    const optimalTempCount = tempReadings.filter(r => r.temperature! >= 20 && r.temperature! <= 28).length;
    tempScore = (optimalTempCount / tempReadings.length) * 35;
  }
  
  // Humidity control (ideal range 40-60%) - 35% weight
  const humidityReadings = recentReadings.filter(r => r.humidity != null);
  let humidityScore = 20;
  if (humidityReadings.length > 0) {
    const optimalHumidityCount = humidityReadings.filter(r => r.humidity! >= 40 && r.humidity! <= 60).length;
    humidityScore = (optimalHumidityCount / humidityReadings.length) * 35;
  }
  
  // Air quality (PM2.5 should be < 25 μg/m³) - 30% weight
  const pm25Readings = recentReadings.filter(r => r.pm2_5 != null);
  let airQualityScore = 20;
  if (pm25Readings.length > 0) {
    const goodAirQualityCount = pm25Readings.filter(r => r.pm2_5! < 25).length;
    airQualityScore = (goodAirQualityCount / pm25Readings.length) * 30;
  }
  
  totalScore = tempScore + humidityScore + airQualityScore;
  
  let level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  if (totalScore >= 85) level = 'Excellent';
  else if (totalScore >= 70) level = 'Good';
  else if (totalScore >= 50) level = 'Fair';
  else if (totalScore >= 30) level = 'Poor';
  else level = 'Critical';
  
  return { level, score: Math.round(totalScore) };
}

// Calculate structural integrity based on vibration and stability
export function calculateStructuralIntegrity(
  sensorReadings: Array<{
    accel_magnitude?: number;
    gyro_magnitude?: number;
    temperature?: number;
    pressure?: number;
    recorded_at: string;
  }>
): { level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'; score: number } {
  if (sensorReadings.length === 0) {
    return { level: 'Excellent', score: 90 };
  }

  const recentReadings = sensorReadings.slice(-300); // Last 300 readings
  let totalScore = 0;
  
  // Vibration stability (low vibration = good structural integrity) - 40% weight
  const vibrationReadings = recentReadings.filter(r => r.accel_magnitude != null || r.gyro_magnitude != null);
  let vibrationScore = 35;
  if (vibrationReadings.length > 0) {
    const highVibrationCount = vibrationReadings.filter(r => 
      (r.accel_magnitude || 0) > 2.0 || (r.gyro_magnitude || 0) > 1.5
    ).length;
    vibrationScore = Math.max(5, 40 - (highVibrationCount / vibrationReadings.length) * 40);
  }
  
  // Temperature stability (consistent readings indicate good structure) - 35% weight
  const tempReadings = recentReadings.filter(r => r.temperature != null).map(r => r.temperature!);
  let stabilityScore = 30;
  if (tempReadings.length > 10) {
    const tempVariance = calculateVariance(tempReadings);
    stabilityScore = Math.max(5, 35 - Math.min(tempVariance * 2, 30));
  }
  
  // Pressure stability (atmospheric pressure should be stable) - 25% weight
  const pressureReadings = recentReadings.filter(r => r.pressure != null).map(r => r.pressure!);
  let pressureScore = 20;
  if (pressureReadings.length > 10) {
    const pressureVariance = calculateVariance(pressureReadings);
    pressureScore = Math.max(5, 25 - Math.min(pressureVariance / 100, 20));
  }
  
  totalScore = vibrationScore + stabilityScore + pressureScore;
  
  let level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  if (totalScore >= 90) level = 'Excellent';
  else if (totalScore >= 75) level = 'Good';
  else if (totalScore >= 60) level = 'Fair';
  else if (totalScore >= 40) level = 'Poor';
  else level = 'Critical';
  
  return { level, score: Math.round(totalScore) };
}

// Calculate maintenance quality based on alert resolution and task completion
export function calculateMaintenanceQualityScore(
  alerts: Array<{ 
    resolved_at?: string; 
    created_at: string; 
    severity: string;
  }>,
  maintenanceTasks: Array<{
    status: string;
    task_type: string;
    due_date: string;
    completed_at?: string;
  }>
): { level: 'Excellent' | 'High' | 'Good' | 'Fair' | 'Poor'; score: number } {
  let totalScore = 0;
  
  // Alert resolution efficiency (40% weight)
  let alertScore = 25;
  if (alerts.length > 0) {
    const resolvedAlerts = alerts.filter(alert => alert.resolved_at != null);
    const resolutionRate = resolvedAlerts.length / alerts.length;
    alertScore = resolutionRate * 40;
  }
  
  // Maintenance task completion (35% weight)
  let taskScore = 20;
  if (maintenanceTasks.length > 0) {
    const completedTasks = maintenanceTasks.filter(task => task.status === 'completed');
    const completionRate = completedTasks.length / maintenanceTasks.length;
    taskScore = completionRate * 35;
  }
  
  // Preventive vs reactive maintenance ratio (25% weight)
  let preventiveScore = 15;
  if (maintenanceTasks.length > 0) {
    const preventiveTasks = maintenanceTasks.filter(task => 
      task.task_type === 'preventive' || task.task_type === 'routine'
    );
    const preventiveRatio = preventiveTasks.length / maintenanceTasks.length;
    preventiveScore = preventiveRatio * 25;
  }
  
  totalScore = alertScore + taskScore + preventiveScore;
  
  let level: 'Excellent' | 'High' | 'Good' | 'Fair' | 'Poor';
  if (totalScore >= 85) level = 'Excellent';
  else if (totalScore >= 70) level = 'High';
  else if (totalScore >= 55) level = 'Good';
  else if (totalScore >= 40) level = 'Fair';
  else level = 'Poor';
  
  return { level, score: Math.round(totalScore) };
}

// Helper function to calculate variance
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}