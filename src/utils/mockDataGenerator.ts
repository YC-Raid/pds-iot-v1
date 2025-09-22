import { addHours, format, startOfDay, endOfDay, eachHourOfInterval } from 'date-fns';

export interface MockSensorReading {
  original_id: number;
  recorded_at: string;
  temperature: number;
  humidity: number;
  pressure: number;
  gas_resistance: number;
  pm1_0: number;
  pm2_5: number;
  pm10: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  accel_magnitude: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  gyro_magnitude: number;
  anomaly_score: number;
  predicted_failure_probability: number;
  quality_score: number;
  maintenance_recommendation: string;
  location: string;
  processing_version: string;
}

// Base sensor values with realistic ranges
const SENSOR_BASELINES = {
  temperature: { base: 24.5, variance: 3.0, min: 18, max: 32 },
  humidity: { base: 65, variance: 8, min: 40, max: 85 },
  pressure: { base: 1013.25, variance: 15, min: 980, max: 1040 },
  gas_resistance: { base: 50000, variance: 15000, min: 20000, max: 80000 },
  pm1_0: { base: 8, variance: 4, min: 2, max: 25 },
  pm2_5: { base: 12, variance: 6, min: 3, max: 35 },
  pm10: { base: 18, variance: 8, min: 5, max: 50 },
  accel_x: { base: 0.1, variance: 0.3, min: -2, max: 2 },
  accel_y: { base: -0.05, variance: 0.3, min: -2, max: 2 },
  accel_z: { base: 9.8, variance: 0.2, min: 9.5, max: 10.1 },
  gyro_x: { base: 0.02, variance: 0.1, min: -0.5, max: 0.5 },
  gyro_y: { base: -0.01, variance: 0.1, min: -0.5, max: 0.5 },
  gyro_z: { base: 0.005, variance: 0.05, min: -0.2, max: 0.2 },
};

// Generate realistic sensor value with daily and hourly patterns
function generateSensorValue(
  baseline: typeof SENSOR_BASELINES.temperature,
  hour: number,
  dayOfYear: number,
  sensorType: keyof typeof SENSOR_BASELINES
): number {
  const { base, variance, min, max } = baseline;
  
  // Daily pattern (temperature peaks at 2pm, humidity inverse pattern)
  let dailyFactor = 0;
  if (sensorType === 'temperature') {
    dailyFactor = Math.sin(((hour - 6) / 12) * Math.PI) * 0.3;
  } else if (sensorType === 'humidity') {
    dailyFactor = -Math.sin(((hour - 6) / 12) * Math.PI) * 0.2;
  } else if (sensorType === 'pressure') {
    dailyFactor = Math.sin(((hour - 10) / 12) * Math.PI) * 0.1;
  }
  
  // Seasonal pattern (subtle for Singapore)
  const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.1;
  
  // Random noise
  const noise = (Math.random() - 0.5) * 2;
  
  const value = base + (base * dailyFactor) + (base * seasonalFactor) + (variance * noise);
  return Math.max(min, Math.min(max, Number(value.toFixed(2))));
}

// Generate mock data for a specific date range
export function generateMockSensorData(
  startDate: Date,
  endDate: Date,
  readingsPerHour: number = 12
): MockSensorReading[] {
  const mockReadings: MockSensorReading[] = [];
  let mockId = 900000; // Start with high ID to avoid conflicts
  
  const hours = eachHourOfInterval({ start: startDate, end: endDate });
  
  hours.forEach((hour, hourIndex) => {
    const dayOfYear = Math.floor((hour.getTime() - new Date(hour.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate readings for this hour
    for (let reading = 0; reading < readingsPerHour; reading++) {
      const readingTime = addHours(hour, reading / readingsPerHour);
      
      // Generate sensor values
      const temperature = generateSensorValue(SENSOR_BASELINES.temperature, hour.getHours(), dayOfYear, 'temperature');
      const humidity = generateSensorValue(SENSOR_BASELINES.humidity, hour.getHours(), dayOfYear, 'humidity');
      const pressure = generateSensorValue(SENSOR_BASELINES.pressure, hour.getHours(), dayOfYear, 'pressure');
      const gas_resistance = generateSensorValue(SENSOR_BASELINES.gas_resistance, hour.getHours(), dayOfYear, 'gas_resistance');
      
      const pm1_0 = Math.round(generateSensorValue(SENSOR_BASELINES.pm1_0, hour.getHours(), dayOfYear, 'pm1_0'));
      const pm2_5 = Math.round(generateSensorValue(SENSOR_BASELINES.pm2_5, hour.getHours(), dayOfYear, 'pm2_5'));
      const pm10 = Math.round(generateSensorValue(SENSOR_BASELINES.pm10, hour.getHours(), dayOfYear, 'pm10'));
      
      const accel_x = generateSensorValue(SENSOR_BASELINES.accel_x, hour.getHours(), dayOfYear, 'accel_x');
      const accel_y = generateSensorValue(SENSOR_BASELINES.accel_y, hour.getHours(), dayOfYear, 'accel_y');
      const accel_z = generateSensorValue(SENSOR_BASELINES.accel_z, hour.getHours(), dayOfYear, 'accel_z');
      const accel_magnitude = Math.sqrt(accel_x * accel_x + accel_y * accel_y + accel_z * accel_z);
      
      const gyro_x = generateSensorValue(SENSOR_BASELINES.gyro_x, hour.getHours(), dayOfYear, 'gyro_x');
      const gyro_y = generateSensorValue(SENSOR_BASELINES.gyro_y, hour.getHours(), dayOfYear, 'gyro_y');
      const gyro_z = generateSensorValue(SENSOR_BASELINES.gyro_z, hour.getHours(), dayOfYear, 'gyro_z');
      const gyro_magnitude = Math.sqrt(gyro_x * gyro_x + gyro_y * gyro_y + gyro_z * gyro_z);
      
      // Calculate anomaly score based on deviation from normal ranges
      let anomaly_score = 0;
      if (temperature > 28 || temperature < 20) anomaly_score += 0.1;
      if (humidity > 75 || humidity < 50) anomaly_score += 0.1;
      if (pm2_5 > 25) anomaly_score += 0.15;
      if (accel_magnitude > 10.5 || accel_magnitude < 9.2) anomaly_score += 0.1;
      
      // Add some random anomaly spikes (5% chance)
      if (Math.random() < 0.05) {
        anomaly_score += Math.random() * 0.3;
      }
      
      anomaly_score = Math.min(1.0, anomaly_score);
      
      const mockReading: MockSensorReading = {
        original_id: mockId++,
        recorded_at: readingTime.toISOString(),
        temperature: Number(temperature.toFixed(2)),
        humidity: Number(humidity.toFixed(2)),
        pressure: Number(pressure.toFixed(2)),
        gas_resistance: Number(gas_resistance.toFixed(0)),
        pm1_0,
        pm2_5,
        pm10,
        accel_x: Number(accel_x.toFixed(3)),
        accel_y: Number(accel_y.toFixed(3)),
        accel_z: Number(accel_z.toFixed(3)),
        accel_magnitude: Number(accel_magnitude.toFixed(3)),
        gyro_x: Number(gyro_x.toFixed(3)),
        gyro_y: Number(gyro_y.toFixed(3)),
        gyro_z: Number(gyro_z.toFixed(3)),
        gyro_magnitude: Number(gyro_magnitude.toFixed(3)),
        anomaly_score: Number(anomaly_score.toFixed(3)),
        predicted_failure_probability: Number((anomaly_score * 0.4 + Math.random() * 0.1).toFixed(3)),
        quality_score: Math.round(95 + Math.random() * 5),
        maintenance_recommendation: anomaly_score > 0.3 ? 'Monitor closely' : 'Normal operation',
        location: 'hangar_01',
        processing_version: 'v1.0_mock'
      };
      
      mockReadings.push(mockReading);
    }
  });
  
  console.log(`📊 Generated ${mockReadings.length} mock sensor readings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  return mockReadings;
}

// Identify missing date ranges in existing data
export function findDataGaps(existingData: Array<{ recorded_at: string }>, startDate: Date, endDate: Date): Array<{ start: Date; end: Date }> {
  const gaps: Array<{ start: Date; end: Date }> = [];
  
  // Sort existing data by date
  const sortedData = existingData
    .map(d => new Date(d.recorded_at))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const checkDate = new Date(startDate);
  
  while (checkDate <= endDate) {
    const dayStart = startOfDay(checkDate);
    const dayEnd = endOfDay(checkDate);
    
    // Check if there's any data for this day
    const hasDataForDay = sortedData.some(date => 
      date >= dayStart && date <= dayEnd
    );
    
    if (!hasDataForDay) {
      // Find the end of this gap
      let gapEnd = new Date(dayEnd);
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      while (nextDay <= endDate) {
        const nextDayStart = startOfDay(nextDay);
        const nextDayEnd = endOfDay(nextDay);
        
        const hasDataForNextDay = sortedData.some(date => 
          date >= nextDayStart && date <= nextDayEnd
        );
        
        if (hasDataForNextDay) break;
        
        gapEnd = new Date(nextDayEnd);
        nextDay.setDate(nextDay.getDate() + 1);
      }
      
      gaps.push({ start: dayStart, end: gapEnd });
      checkDate.setTime(gapEnd.getTime() + 24 * 60 * 60 * 1000); // Skip to day after gap
    } else {
      checkDate.setDate(checkDate.getDate() + 1);
    }
  }
  
  return gaps;
}