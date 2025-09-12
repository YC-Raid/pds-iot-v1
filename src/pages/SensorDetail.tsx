import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowLeft, Activity, Thermometer, Droplets, Gauge, Zap, Eye, Cloud, Wind, Waves } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CustomTooltip } from "@/components/ui/custom-chart-tooltip";
import { EnhancedSensorChart, SensorConfig, DataPoint } from "@/components/dashboard/EnhancedSensorChart";
import AnomalyDetection from "@/components/dashboard/AnomalyDetection";

import { calculateDynamicThresholds } from "@/utils/dynamicThresholds";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const SensorDetail = () => {
  const { sensorType } = useParams();
  const navigate = useNavigate();
  const { getSensorReadingsByTimeRange, getAggregatedSensorData, getHourlyAveragedData, sensorReadings } = useSensorData();
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('24');
  const [isLoading, setIsLoading] = useState(true);

  // Get current reading - EXACT same logic as SensorOverview but for all sensor types
  const latestReading = sensorReadings[0];
  const currentReading = useMemo(() => {
    if (!latestReading) return null;
    
    switch (sensorType) {
      case 'temperature': return latestReading.temperature;
      case 'humidity': return latestReading.humidity;
      case 'pressure': return latestReading.pressure;
      case 'gas': return latestReading.gas_resistance;
      case 'pm1': return latestReading.pm1_0;
      case 'pm25': return latestReading.pm2_5;
      case 'pm10': return latestReading.pm10;
      default: return latestReading.temperature;
    }
  }, [latestReading, sensorType]);

  // Static test data as fallback
  const testData = [
    { time: "10:00", value: 25.5, x_axis: 1.2, y_axis: -0.8, z_axis: 9.8, magnitude: 9.9 },
    { time: "10:05", value: 26.1, x_axis: 1.1, y_axis: -0.9, z_axis: 9.7, magnitude: 9.8 },
    { time: "10:10", value: 25.8, x_axis: 1.3, y_axis: -0.7, z_axis: 9.9, magnitude: 10.0 },
    { time: "10:15", value: 26.3, x_axis: 1.0, y_axis: -1.0, z_axis: 9.6, magnitude: 9.7 },
    { time: "10:20", value: 25.9, x_axis: 1.4, y_axis: -0.6, z_axis: 10.0, magnitude: 10.1 }
  ];

  const sensorConfig = {
    temperature: { name: "Temperature Sensor", icon: Thermometer, unit: "°C", dataKey: "temperature" },
    humidity: { name: "Humidity Sensor", icon: Droplets, unit: "%", dataKey: "humidity" },
    pressure: { name: "Pressure Sensor", icon: Gauge, unit: "hPa", dataKey: "pressure" },
    gas: { name: "Gas Quality Sensor", icon: Zap, unit: "Ω", dataKey: "gas_resistance" },
    pm1: { name: "PM1.0 Monitor", icon: Eye, unit: "μg/m³", dataKey: "pm1_0" },
    pm25: { name: "PM2.5 Monitor", icon: Cloud, unit: "μg/m³", dataKey: "pm2_5" },
    pm10: { name: "PM10 Monitor", icon: Wind, unit: "μg/m³", dataKey: "pm10" },
    acceleration: { name: "Accelerometer", icon: Activity, unit: "m/s²", dataKey: "accel" },
    rotation: { name: "Gyroscope", icon: Waves, unit: "°/s", dataKey: "gyro" }
  };

  const currentSensor = sensorConfig[sensorType] || sensorConfig.temperature;
  const IconComponent = currentSensor.icon;

  // Dynamic thresholds for all sensors - always calculate when we have data
  const dynamicConfig = useMemo(() => {
    // Define optimal ranges and Y-axis ranges for each sensor type
    const sensorDefaults = {
      temperature: { optimalRange: { min: 18, max: 25 }, yAxisRange: { min: 0, max: 50 } },
      humidity: { optimalRange: { min: 40, max: 60 }, yAxisRange: { min: 0, max: 100 } },
      pressure: { optimalRange: { min: 1010, max: 1030 }, yAxisRange: { min: 980, max: 1050 } },
      gas: { optimalRange: { min: 50000, max: 200000 }, yAxisRange: { min: 0, max: 300000 } },
      pm1: { optimalRange: { min: 0, max: 12 }, yAxisRange: { min: 0, max: 50 } },
      pm25: { optimalRange: { min: 0, max: 25 }, yAxisRange: { min: 0, max: 100 } },
      pm10: { optimalRange: { min: 0, max: 50 }, yAxisRange: { min: 0, max: 150 } }
    };

    const defaults = sensorDefaults[sensorType] || sensorDefaults.temperature;
    
    if (['acceleration', 'rotation'].includes(sensorType)) {
      return {
        thresholds: [],
        optimalRange: { min: -2, max: 2 },
        yAxisRange: { min: -5, max: 5 },
        statistics: { mean: 0, std: 0, min: 0, max: 0 }
      };
    }

    const dataPoints = chartData.map(d => ({
      value: d.value,
      timestamp: d.timestamp || d.time
    }));
    
    const thresholdResult = calculateDynamicThresholds(dataPoints, sensorType, 3);
    
    return {
      thresholds: thresholdResult.thresholds,
      optimalRange: thresholdResult.optimalRange,
      yAxisRange: thresholdResult.yAxisRange,
      statistics: thresholdResult.statistics
    };
  }, [chartData, sensorType]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        const hours = parseInt(timeRange);
        let data: any[] = [];

        if (hours === 24 && !['acceleration', 'rotation'].includes(sensorType)) {
          // Use hourly averaged data from processed_sensor_readings for 24h single-value sensors
          console.log(`🔍 [DEBUG] Fetching hourly data for sensor: ${sensorType}`);
          const hourlyData = await getHourlyAveragedData(sensorType);
          console.log(`📊 [DEBUG] Hourly data received:`, hourlyData);
          
          // Generate full 24-hour range: data is already in Singapore time
          const now = new Date();
          const currentHour = new Date(now);
          currentHour.setMinutes(0, 0, 0); // Round down to current hour
          const startTime = new Date(currentHour.getTime() - 24 * 60 * 60 * 1000);

          console.log(`⏰ [DEBUG] Time range (SG time): ${startTime.toISOString()} to ${currentHour.toISOString()}`);

          const fullRange: any[] = [];
          for (let i = 0; i <= 24; i++) { // 25 data points: start hour to current hour inclusive
            const bucketDate = new Date(startTime.getTime() + i * 60 * 60 * 1000);
            const hourKey = bucketDate.getFullYear() + '-' + 
                           (bucketDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                           bucketDate.getDate().toString().padStart(2, '0') + ' ' + 
                           bucketDate.getHours().toString().padStart(2, '0') + ':00:00';
            
            const timeLabel = bucketDate.getDate() + ' ' + 
                            bucketDate.toLocaleDateString('en', {month: 'short'}) + ' ' + 
                            bucketDate.getHours().toString().padStart(2, '0') + ':00';
                            
            const matchingData = Array.isArray(hourlyData)
              ? hourlyData.find((d: any) => d.hour_bucket === hourKey)
              : null;

            fullRange.push({
              time: timeLabel,
              value: matchingData ? Number(matchingData.avg_value) : null,
              timestamp: hourKey,
              hour_bucket: hourKey,
              reading_count: matchingData ? matchingData.reading_count : 0,
            });
          }

          console.log(`📈 [DEBUG] Full range data points:`, fullRange.length);
          console.log(`📈 [DEBUG] Sample data points:`, fullRange.slice(0, 3));
          console.log(`📈 [DEBUG] Data points with values:`, fullRange.filter(d => d.value !== null).length);

          setChartData(fullRange);
          setIsLoading(false);
          return;
        } else if (hours <= 24) {
          // Use raw data from processed_sensor_readings for 1h and 24h views
          data = await getSensorReadingsByTimeRange(hours);
        } else if (hours === 168) {
          // 1 week: Try aggregated data first, fallback to raw data
          console.log(`📊 [DEBUG] Trying aggregated data for 1 week view`);
          try {
            const aggregatedData = await getAggregatedSensorData('day', 7);
            console.log(`📊 [DEBUG] Aggregated data result:`, aggregatedData?.length || 0, 'records');
            // Need at least 4 days of aggregated data to show meaningful 1-week view
            if (aggregatedData && aggregatedData.length >= 4) {
              console.log(`✅ [DEBUG] Using ${aggregatedData.length} aggregated day records`);
              data = aggregatedData;
            } else {
              console.log(`⚠️ [DEBUG] Insufficient aggregated data (${aggregatedData?.length || 0} days), falling back to raw data for 1 week`);
              data = await getSensorReadingsByTimeRange(hours);
              console.log(`📊 [DEBUG] Raw data fallback result:`, data?.length || 0, 'records');
            }
          } catch (error) {
            console.error(`❌ [DEBUG] Error with aggregated data, using raw data:`, error);
            data = await getSensorReadingsByTimeRange(hours);
            console.log(`📊 [DEBUG] Raw data fallback result:`, data?.length || 0, 'records');
          }
        } else if (hours === 720) {
          // 1 month: Try aggregated data first, fallback to raw data
          console.log(`📊 [DEBUG] Trying aggregated data for 1 month view`);
          try {
            const aggregatedData = await getAggregatedSensorData('week', 4);
            console.log(`📊 [DEBUG] Aggregated data result:`, aggregatedData?.length || 0, 'records');
            // Need at least 2 weeks of aggregated data to show meaningful 1-month view
            if (aggregatedData && aggregatedData.length >= 2) {
              console.log(`✅ [DEBUG] Using ${aggregatedData.length} aggregated week records`);
              data = aggregatedData;
            } else {
              console.log(`⚠️ [DEBUG] Insufficient aggregated data (${aggregatedData?.length || 0} weeks), falling back to raw data for 1 month`);
              data = await getSensorReadingsByTimeRange(hours);
              console.log(`📊 [DEBUG] Raw data fallback result:`, data?.length || 0, 'records');
            }
          } catch (error) {
            console.error(`❌ [DEBUG] Error with aggregated data, using raw data:`, error);
            data = await getSensorReadingsByTimeRange(hours);
            console.log(`📊 [DEBUG] Raw data fallback result:`, data?.length || 0, 'records');
          }
        }
        
        if (data.length > 0) {
          let formatted = [];
          
          // Check if this is aggregated data or raw data
          const isAggregated = data[0] && data[0].hasOwnProperty('avg_temperature');
          console.log(`📊 [DEBUG] Data type: ${isAggregated ? 'aggregated' : 'raw'}, sample:`, data[0]);
          
          // Handle 1-hour view first (per-minute grouping) for all sensor types
          if (hours === 24) {
            console.log(`📊 [DEBUG] Processing 24-hour view with ${data.length} records from processed_sensor_readings`);
            
            if (data.length === 0) {
              console.log(`⚠️ [DEBUG] No data found for last hour, chart will be empty`);
              setChartData([]);
              setIsLoading(false);
              return;
            }
            
            if (sensorType === 'acceleration') {
              // 24 hours: Group by hour and average - same pattern as 1h but grouped by hour
              const hourGroups = new Map();
              
              data.forEach(reading => {
                const recordedDate = new Date(reading.recorded_at);
                const singaporeHour = `${recordedDate.getHours().toString().padStart(2, '0')}:00`;
                
                if (!hourGroups.has(singaporeHour)) {
                  hourGroups.set(singaporeHour, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = hourGroups.get(singaporeHour);
                
                if (reading.accel_x !== null && reading.accel_x !== undefined) {
                  group.x.push(Number(reading.accel_x));
                }
                if (reading.accel_y !== null && reading.accel_y !== undefined) {
                  group.y.push(Number(reading.accel_y));
                }
                if (reading.accel_z !== null && reading.accel_z !== undefined) {
                  group.z.push(Number(reading.accel_z));
                }
                if (reading.accel_magnitude !== null && reading.accel_magnitude !== undefined) {
                  group.mag.push(Number(reading.accel_magnitude));
                }
              });
              
              formatted = Array.from(hourGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => a.time.localeCompare(b.time));
              
              console.log(`📊 [DEBUG] 24-hour acceleration data grouped into ${formatted.length} hour buckets`);
            } else {
              // 24 hours: Group by hour and average for single-value sensors  
              const hourGroups = new Map();
              const dataKey = {
                'temperature': 'temperature',
                'humidity': 'humidity', 
                'pressure': 'pressure',
                'gas': 'gas_resistance',
                'pm1': 'pm1_0',
                'pm25': 'pm2_5',
                'pm10': 'pm10'
              }[sensorType] || 'temperature';
              
              console.log(`📊 [DEBUG] Processing 24-hour ${sensorType} data using column: ${dataKey}`);
              
              data.forEach(reading => {
                const recordedDate = new Date(reading.recorded_at);
                const hour = `${recordedDate.getHours().toString().padStart(2, '0')}:00`;
                
                const value = reading[dataKey];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                  if (!hourGroups.has(hour)) {
                    hourGroups.set(hour, { values: [], timestamp: reading.recorded_at });
                  }
                  hourGroups.get(hour).values.push(Number(value));
                }
              });
              
              formatted = Array.from(hourGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                value: group.values.length > 0 ? group.values.reduce((sum, val) => sum + val, 0) / group.values.length : 0,
                timestamp: group.timestamp
              })).sort((a, b) => a.time.localeCompare(b.time));
              
              console.log(`📊 [DEBUG] 24-hour ${sensorType} data grouped into ${formatted.length} hour buckets`);
              console.log(`📊 [DEBUG] Sample hour data:`, formatted.slice(0, 3));
            }
           } else if (sensorType === 'acceleration') {
            const maxPoints = 200;
            const step = Math.max(1, Math.ceil(data.length / maxPoints));
            
            if (hours === 24) {
              // 24 hours: Group by hour and average - same pattern as 1h but grouped by hour
              const hourGroups = new Map();
              
              data.forEach(reading => {
                const singaporeDate = new Date(reading.recorded_at);
                const singaporeHour = `${singaporeDate.getHours().toString().padStart(2, '0')}:00`;
                
                if (!hourGroups.has(singaporeHour)) {
                  hourGroups.set(singaporeHour, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = hourGroups.get(singaporeHour);
                group.x.push(Number(reading.accel_x || reading.avg_accel_x) || 0);
                group.y.push(Number(reading.accel_y || reading.avg_accel_y) || 0);
                group.z.push(Number(reading.accel_z || reading.avg_accel_z) || 0);
                group.mag.push(Number(reading.accel_magnitude || reading.avg_accel_magnitude) || 0);
              });
              
              formatted = Array.from(hourGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => a.time.localeCompare(b.time));
              
            } else if (hours === 168) {
              // 1 week: Group by day and average accelerometer data
              const dayGroups = new Map();
              
              data.forEach(reading => {
                const singaporeDate = new Date(reading.recorded_at);
                const singaporeDay = singaporeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                if (!dayGroups.has(singaporeDay)) {
                  dayGroups.set(singaporeDay, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = dayGroups.get(singaporeDay);
                group.x.push(Number(reading.accel_x || reading.avg_accel_x) || 0);
                group.y.push(Number(reading.accel_y || reading.avg_accel_y) || 0);
                group.z.push(Number(reading.accel_z || reading.avg_accel_z) || 0);
                group.mag.push(Number(reading.accel_magnitude || reading.avg_accel_magnitude) || 0);
              });
              
              formatted = Array.from(dayGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => new Date(a.time + ', 2024').getTime() - new Date(b.time + ', 2024').getTime());
              
            } else if (hours === 720) {
              // 1 month: Group by week and average accelerometer data
              const weekGroups = new Map();
              const currentDate = new Date();
              
              data.forEach(reading => {
                const readingDate = new Date(reading.recorded_at);
                const weeksDiff = Math.floor((currentDate.getTime() - readingDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                const weekLabel = `Week ${Math.max(1, 4 - weeksDiff)}`;
                
                if (!weekGroups.has(weekLabel)) {
                  weekGroups.set(weekLabel, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = weekGroups.get(weekLabel);
                group.x.push(Number(reading.accel_x || reading.avg_accel_x) || 0);
                group.y.push(Number(reading.accel_y || reading.avg_accel_y) || 0);
                group.z.push(Number(reading.accel_z || reading.avg_accel_z) || 0);
                group.mag.push(Number(reading.accel_magnitude || reading.avg_accel_magnitude) || 0);
              });
              
              formatted = Array.from(weekGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => a.time.localeCompare(b.time));
            }
          } else if (sensorType === 'rotation') {
            const maxPoints = hours === 1 ? 60 : 200;
            const step = Math.max(1, Math.ceil(data.length / maxPoints));
            if (hours === 1) {
              // 1 hour: Group by minute and average gyroscope data
              const minuteGroups = new Map();
              
              data.forEach(reading => {
                // For sensor_data, use local_time field directly (already Singapore time)
                // For processed_sensor_readings, recorded_at is already Singapore time
                let singaporeTime;
                if (reading.local_time) {
                  // sensor_data table - already has Singapore local time
                  singaporeTime = reading.local_time.substring(0, 5); // Extract HH:MM
                } else {
                  // processed_sensor_readings table - already in Singapore time
                  const singaporeDate = new Date(reading.recorded_at || reading.time_bucket);
                  singaporeTime = `${singaporeDate.getHours().toString().padStart(2, '0')}:${singaporeDate.getMinutes().toString().padStart(2, '0')}`;
                }
                
                if (!minuteGroups.has(singaporeTime)) {
                  minuteGroups.set(singaporeTime, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = minuteGroups.get(singaporeTime);
                group.x.push(Number(reading.gyro_x || reading.avg_gyro_x) || 0);
                group.y.push(Number(reading.gyro_y || reading.avg_gyro_y) || 0);
                group.z.push(Number(reading.gyro_z || reading.avg_gyro_z) || 0);
                group.mag.push(Number(reading.gyro_magnitude || reading.avg_gyro_magnitude) || 0);
              });
              
              formatted = Array.from(minuteGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => a.time.localeCompare(b.time));
              
            } else if (hours === 24) {
              // 24 hours: Group by hour and average - same pattern as 1h but grouped by hour
              const hourGroups = new Map();
              
              data.forEach(reading => {
                const singaporeDate = new Date(reading.recorded_at);
                const singaporeHour = `${singaporeDate.getHours().toString().padStart(2, '0')}:00`;
                
                if (!hourGroups.has(singaporeHour)) {
                  hourGroups.set(singaporeHour, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = hourGroups.get(singaporeHour);
                group.x.push(Number(reading.gyro_x || reading.avg_gyro_x) || 0);
                group.y.push(Number(reading.gyro_y || reading.avg_gyro_y) || 0);
                group.z.push(Number(reading.gyro_z || reading.avg_gyro_z) || 0);
                group.mag.push(Number(reading.gyro_magnitude || reading.avg_gyro_magnitude) || 0);
              });
              
              formatted = Array.from(hourGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => a.time.localeCompare(b.time));
              
            } else if (hours === 168) {
              // 1 week: Group by day and average gyroscope data
              const dayGroups = new Map();
              
              data.forEach(reading => {
                const singaporeDate = new Date(reading.recorded_at);
                const singaporeDay = singaporeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                if (!dayGroups.has(singaporeDay)) {
                  dayGroups.set(singaporeDay, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = dayGroups.get(singaporeDay);
                group.x.push(Number(reading.gyro_x || reading.avg_gyro_x) || 0);
                group.y.push(Number(reading.gyro_y || reading.avg_gyro_y) || 0);
                group.z.push(Number(reading.gyro_z || reading.avg_gyro_z) || 0);
                group.mag.push(Number(reading.gyro_magnitude || reading.avg_gyro_magnitude) || 0);
              });
              
              formatted = Array.from(dayGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => new Date(a.time + ', 2024').getTime() - new Date(b.time + ', 2024').getTime());
              
            } else if (hours === 720) {
              // 1 month: Group by week and average gyroscope data
              const weekGroups = new Map();
              const currentDate = new Date();
              
              data.forEach(reading => {
                const readingDate = new Date(reading.recorded_at);
                const weeksDiff = Math.floor((currentDate.getTime() - readingDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                const weekLabel = `Week ${Math.max(1, 4 - weeksDiff)}`;
                
                if (!weekGroups.has(weekLabel)) {
                  weekGroups.set(weekLabel, { x: [], y: [], z: [], mag: [], timestamp: reading.recorded_at });
                }
                const group = weekGroups.get(weekLabel);
                group.x.push(Number(reading.gyro_x || reading.avg_gyro_x) || 0);
                group.y.push(Number(reading.gyro_y || reading.avg_gyro_y) || 0);
                group.z.push(Number(reading.gyro_z || reading.avg_gyro_z) || 0);
                group.mag.push(Number(reading.gyro_magnitude || reading.avg_gyro_magnitude) || 0);
              });
              
              formatted = Array.from(weekGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                x_axis: group.x.reduce((sum, val) => sum + val, 0) / group.x.length,
                y_axis: group.y.reduce((sum, val) => sum + val, 0) / group.y.length,
                z_axis: group.z.reduce((sum, val) => sum + val, 0) / group.z.length,
                magnitude: group.mag.reduce((sum, val) => sum + val, 0) / group.mag.length
              })).sort((a, b) => a.time.localeCompare(b.time));
            }
          } else {
            // Single value sensors with time range filtering and aggregation
            const dataKey = currentSensor.dataKey;
            
            if (hours === 1) {
              // 1 hour: Group by minute and average
              const minuteGroups = new Map();
              
              data.forEach(reading => {
                // recorded_at is already in Singapore timezone in the database
                const singaporeDate = new Date(reading.recorded_at || reading.time_bucket);
                const singaporeTime = `${singaporeDate.getHours().toString().padStart(2, '0')}:${singaporeDate.getMinutes().toString().padStart(2, '0')}`;
                
                if (!minuteGroups.has(singaporeTime)) {
                  minuteGroups.set(singaporeTime, { values: [], timestamp: reading.recorded_at || reading.utc_timestamp });
                }
                minuteGroups.get(singaporeTime).values.push(Number(reading[dataKey]) || 0);
              });
              
              formatted = Array.from(minuteGroups.entries()).map(([timeLabel, group]) => ({
                time: timeLabel,
                value: group.values.reduce((sum, val) => sum + val, 0) / group.values.length,
                timestamp: group.timestamp
              })).sort((a, b) => a.time.localeCompare(b.time));
              
            } else if (hours === 24) {
              // 24 hours: Group by date + hour with Singapore timezone data
              const hourGroups = new Map();
              
              console.log(`🔍 Processing ${data.length} readings for ${dataKey} over 24 hours`);
              console.log('Sample data:', data.slice(0, 3));
              
              data.forEach(reading => {
                // recorded_at is already Singapore time, use it directly
                const singaporeDate = new Date(reading.recorded_at || reading.time_bucket);
                const dateStr = singaporeDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                const hourStr = singaporeDate.getHours().toString().padStart(2, '0') + ':00';
                const timeKey = `${dateStr} ${hourStr}`;
                
                if (!hourGroups.has(timeKey)) {
                  hourGroups.set(timeKey, { values: [], timestamp: reading.recorded_at || reading.utc_timestamp, sortKey: singaporeDate.getTime() });
                }
                const group = hourGroups.get(timeKey);
                const value = Number(reading[dataKey]) || 0;
                // Include ALL values including 0 and negative values
                group.values.push(value);
              });
              
              console.log(`📊 Created ${hourGroups.size} hour groups for ${dataKey}`);
              
              formatted = Array.from(hourGroups.entries())
                .map(([timeLabel, group]) => ({
                  time: timeLabel,
                  value: group.values.length > 0 ? (group.values.reduce((sum, val) => sum + val, 0) / group.values.length) : 0,
                  timestamp: group.timestamp
                }))
                .sort((a, b) => {
                  const aGroup = hourGroups.get(a.time);
                  const bGroup = hourGroups.get(b.time);
                  return aGroup.sortKey - bGroup.sortKey;
                });
              
              console.log(`✅ Formatted ${formatted.length} data points for chart`);
              console.log('Formatted sample:', formatted.slice(0, 3));
              
             } else {
                // Longer periods: Check if we have aggregated data or use raw data with downsampling
                if (isAggregated) {
                  console.log(`📊 [DEBUG] Processing aggregated data for ${sensorType}`);
                  // Use aggregated data columns for single-value sensors
                  const valueColumn = {
                    'temperature': 'avg_temperature',
                    'humidity': 'avg_humidity', 
                    'pressure': 'avg_pressure',
                    'gas': 'avg_gas_resistance',
                    'pm1': 'avg_pm1_0',
                    'pm25': 'avg_pm2_5',
                    'pm10': 'avg_pm10'
                  }[sensorType] || 'avg_temperature';

                  if (hours === 168) {
                    // 1 week: aggregated by day
                    formatted = data.map(reading => {
                      const bucketDate = new Date(reading.time_bucket);
                      const timeLabel = bucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return {
                        time: timeLabel,
                        value: Number(reading[valueColumn]) || null,
                        timestamp: reading.time_bucket
                      };
                    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  } else if (hours === 720) {
                    // 1 month: aggregated by week - show actual week dates
                    formatted = data.map(reading => {
                      const bucketDate = new Date(reading.time_bucket);
                      // Calculate week start and end dates
                      const weekStart = new Date(bucketDate);
                      weekStart.setDate(bucketDate.getDate() - bucketDate.getDay()); // Start of week (Sunday)
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
                      
                      const timeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                      return {
                        time: timeLabel,
                        value: Number(reading[valueColumn]) || null,
                        timestamp: reading.time_bucket
                      };
                    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  } else {
                    // Other periods: use existing raw data logic
                    const maxPoints = 200;
                    const step = Math.max(1, Math.ceil(data.length / maxPoints));
                    formatted = data.filter((_, i) => i % step === 0 || i === data.length - 1).map(reading => {
                      const bucketDate = new Date(reading.time_bucket);
                      const timeLabel = bucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return {
                        time: timeLabel,
                        value: Number(reading[valueColumn]) || null,
                        timestamp: reading.time_bucket
                      };
                    });
                  }
                } else {
                  console.log(`📊 [DEBUG] Processing raw data for ${sensorType} (${data.length} records)`);
                  // Use raw data with intelligent grouping for week/month
                  if (hours === 168) {
                    // 1 week: Group by day
                    const dayGroups = new Map();
                    data.forEach(reading => {
                      const singaporeDate = new Date(reading.recorded_at);
                      const singaporeDay = singaporeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      
                      if (!dayGroups.has(singaporeDay)) {
                        dayGroups.set(singaporeDay, { values: [], timestamp: reading.recorded_at, sortKey: singaporeDate.getTime() });
                      }
                      const value = Number(reading[dataKey]) || 0;
                      dayGroups.get(singaporeDay).values.push(value);
                    });
                    
                    formatted = Array.from(dayGroups.entries()).map(([timeLabel, group]) => ({
                      time: timeLabel,
                      value: group.values.length > 0 ? group.values.reduce((sum, val) => sum + val, 0) / group.values.length : null,
                      timestamp: group.timestamp
                    })).sort((a, b) => {
                      const aGroup = dayGroups.get(a.time);
                      const bGroup = dayGroups.get(b.time);
                      return aGroup.sortKey - bGroup.sortKey;
                    });
                    
                  } else if (hours === 720) {
                    // 1 month: Group by week with actual date ranges
                    const weekGroups = new Map();
                    
                    data.forEach(reading => {
                      const readingDate = new Date(reading.recorded_at);
                      // Get start of week (Sunday)
                      const weekStart = new Date(readingDate);
                      weekStart.setDate(readingDate.getDate() - readingDate.getDay());
                      weekStart.setHours(0, 0, 0, 0);
                      
                      // Get end of week (Saturday)
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      
                      const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                      
                      if (!weekGroups.has(weekLabel)) {
                        weekGroups.set(weekLabel, { values: [], timestamp: reading.recorded_at, sortKey: weekStart.getTime() });
                      }
                      const value = Number(reading[dataKey]) || 0;
                      weekGroups.get(weekLabel).values.push(value);
                    });
                    
                    formatted = Array.from(weekGroups.entries()).map(([timeLabel, group]) => ({
                      time: timeLabel,
                      value: group.values.length > 0 ? group.values.reduce((sum, val) => sum + val, 0) / group.values.length : null,
                      timestamp: group.timestamp
                    })).sort((a, b) => {
                      const aGroup = weekGroups.get(a.time);
                      const bGroup = weekGroups.get(b.time);
                      return aGroup.sortKey - bGroup.sortKey;
                    });
                    
                  } else {
                    // Other periods: use existing logic with downsampling  
                    const maxPoints = 200;
                    const step = Math.max(1, Math.ceil(data.length / maxPoints));
                    
                    formatted = data.filter((_, i) => i % step === 0 || i === data.length - 1).map(reading => {
                      // For longer periods, show date instead of time
                      let timeLabel;
                      if (reading.local_date) {
                        // sensor_data table - use local_date which is already Singapore date
                        const date = new Date(reading.local_date);
                        timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } else {
                        // processed_sensor_readings table - recorded_at is already Singapore time
                        const singaporeDate = new Date(reading.recorded_at || reading.time_bucket);
                        timeLabel = singaporeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }
                      
                      return {
                        time: timeLabel,
                        value: Number(reading[dataKey] || reading[`avg_${dataKey}`]) || 0,
                        timestamp: reading.recorded_at || reading.utc_timestamp
                      };
                    });
                  }
                }
              }
          }
         
          setChartData(formatted);
        } else {
          setChartData(testData);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setChartData(testData); // Fallback to test data
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sensorType, timeRange, getSensorReadingsByTimeRange, getAggregatedSensorData]);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '1': return '1 Hour';
      case '24': return '24 Hours';
      case '168': return '1 Week';
      case '720': return '1 Month';
      default: return '24 Hours';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/?tab=sensors')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Sensors
              </Button>
              <div className="flex items-center gap-3">
                <IconComponent className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{currentSensor.name}</CardTitle>
                  <CardDescription>Hangar 01 • Real-time Analysis</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Chart for All Supported Sensors */}
        {['temperature', 'humidity', 'pressure', 'gas', 'pm1', 'pm25', 'pm10'].includes(sensorType) ? (
          <div className="w-full overflow-hidden">
            <div className="max-w-full">
              <EnhancedSensorChart
                data={chartData}
                config={{
                  name: currentSensor.name.replace(' Sensor', '').replace(' Monitor', ''),
                  unit: currentSensor.unit, 
                  icon: currentSensor.icon,
                  description: `Environmental ${sensorType} monitoring - Mean: ${dynamicConfig.statistics.mean.toFixed(2)}${currentSensor.unit}, Std: ${dynamicConfig.statistics.std.toFixed(2)}${currentSensor.unit}`,
                  optimalRange: dynamicConfig.optimalRange,
                  thresholds: dynamicConfig.thresholds,
                  yAxisRange: dynamicConfig.yAxisRange
                }}
                title={`${currentSensor.name} - ${getTimeRangeLabel()} Analysis`}
                timeRange={getTimeRangeLabel()}
                isLoading={isLoading}
                currentReading={currentReading}
                timeRangeSelector={
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                      <SelectItem value="168">1 Week</SelectItem>
                      <SelectItem value="720">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </div>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{currentSensor.name} - {getTimeRangeLabel()}</CardTitle>
                  <CardDescription>Historical readings and trends ({chartData.length} data points)</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                    <SelectItem value="720">1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="w-full overflow-hidden">
                <div className="h-[300px] sm:h-[400px] w-full">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading sensor data...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={chartData} 
                        margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tick={{ fontSize: 10 }}
                          width={40}
                        />
                        <Tooltip content={<CustomTooltip sensorType={sensorType} />} />
                        
                        {(sensorType === 'acceleration' || sensorType === 'rotation') ? (
                          <>
                            <Line 
                              type="monotone" 
                              dataKey="x_axis" 
                              stroke="hsl(var(--chart-1))" 
                              strokeWidth={2} 
                              name="X-Axis"
                              dot={false}
                              activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="y_axis" 
                              stroke="hsl(var(--chart-2))" 
                              strokeWidth={2} 
                              name="Y-Axis"
                              dot={false}
                              activeDot={{ r: 4, fill: "hsl(var(--chart-2))" }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="z_axis" 
                              stroke="hsl(var(--chart-3))" 
                              strokeWidth={2} 
                              name="Z-Axis"
                              dot={false}
                              activeDot={{ r: 4, fill: "hsl(var(--chart-3))" }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="magnitude" 
                              stroke="hsl(var(--chart-4))" 
                              strokeWidth={3} 
                              strokeDasharray="5 5"
                              name="Magnitude"
                              dot={false}
                              activeDot={{ r: 5, fill: "hsl(var(--chart-4))" }}
                            />
                          </>
                        ) : (
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--chart-1))" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5, fill: "hsl(var(--chart-1))" }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Analytics for All Enhanced Sensors */}
        {['temperature', 'humidity', 'pressure', 'gas', 'pm1', 'pm25', 'pm10'].includes(sensorType) && (
          <div className="grid gap-6">
            <AnomalyDetection 
              data={chartData}
              sensorName={currentSensor.name}
            />
          </div>
        )}

        {/* Sensor-Specific Insights */}
        {sensorType === 'temperature' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Storage Conditions</h4>
              <p className="text-xs text-muted-foreground">
                Optimal range: 18-25°C for most storage applications. 
                Temperature fluctuations can affect stored materials and equipment longevity.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Maintenance Impact</h4>
              <p className="text-xs text-muted-foreground">
                Extreme temperatures may require HVAC system maintenance, 
                insulation checks, or ventilation adjustments.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Compliance Notes</h4>
              <p className="text-xs text-muted-foreground">
                Temperature logs are required for regulatory compliance in pharmaceutical, 
                food storage, and sensitive equipment environments.
              </p>
            </div>
          </div>
        )}

        {sensorType === 'humidity' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Storage Conditions</h4>
              <p className="text-xs text-muted-foreground">
                Optimal range: 40-60% RH for most storage applications. 
                High humidity can cause corrosion, mold, and material degradation.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Maintenance Impact</h4>
              <p className="text-xs text-muted-foreground">
                Excessive humidity may require dehumidifier maintenance, 
                ventilation system checks, or moisture barrier inspections.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Equipment Protection</h4>
              <p className="text-xs text-muted-foreground">
                Proper humidity control prevents condensation on sensitive equipment 
                and extends the lifespan of stored materials.
              </p>
            </div>
          </div>
        )}

        {sensorType === 'pressure' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Environmental Conditions</h4>
              <p className="text-xs text-muted-foreground">
                Normal range: 1010-1030 hPa at sea level. 
                Pressure changes can indicate weather patterns and ventilation issues.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">System Monitoring</h4>
              <p className="text-xs text-muted-foreground">
                Sudden pressure drops may indicate HVAC system malfunctions 
                or structural integrity issues requiring immediate attention.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Safety Considerations</h4>
              <p className="text-xs text-muted-foreground">
                Pressure monitoring helps maintain safe working environments 
                and prevents equipment damage from pressure fluctuations.
              </p>
            </div>
          </div>
        )}

        {sensorType === 'gas' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Air Quality Control</h4>
              <p className="text-xs text-muted-foreground">
                Gas resistance indicates air quality levels. 
                Higher values generally indicate cleaner air with fewer pollutants.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Ventilation Management</h4>
              <p className="text-xs text-muted-foreground">
                Poor gas readings may require ventilation system adjustments, 
                filter replacements, or air purification system maintenance.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Health & Safety</h4>
              <p className="text-xs text-muted-foreground">
                Continuous gas monitoring ensures safe working conditions 
                and early detection of harmful gas concentrations.
              </p>
            </div>
          </div>
        )}

        {(sensorType === 'pm1' || sensorType === 'pm25' || sensorType === 'pm10') && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Particulate Matter</h4>
              <p className="text-xs text-muted-foreground">
                {sensorType === 'pm1' && 'PM1.0: Ultra-fine particles that can penetrate deep into lungs and bloodstream.'}
                {sensorType === 'pm25' && 'PM2.5: Fine particles that pose serious health risks and affect air quality.'}
                {sensorType === 'pm10' && 'PM10: Coarse particles that can cause respiratory irritation.'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Filtration Systems</h4>
              <p className="text-xs text-muted-foreground">
                High particulate levels may require air filter replacements, 
                HEPA system maintenance, or enhanced air purification measures.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium text-sm mb-2">Environmental Impact</h4>
              <p className="text-xs text-muted-foreground">
                Monitoring particulate matter ensures compliance with air quality standards 
                and protects both equipment and personnel health.
              </p>
            </div>
          </div>
        )}

        {/* Current Values - Only for acceleration/rotation sensors that don't use EnhancedSensorChart */}
        {chartData.length > 0 && ['acceleration', 'rotation'].includes(sensorType) && (
          <Card>
            <CardHeader>
              <CardTitle>Current Readings</CardTitle>
              <CardDescription>Latest sensor values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {(sensorType === 'acceleration' || sensorType === 'rotation') ? (
                  <>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold text-chart-1">
                        {chartData[chartData.length - 1]?.x_axis?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-muted-foreground">X-Axis ({currentSensor.unit})</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-2">
                        {chartData[chartData.length - 1]?.y_axis?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-muted-foreground">Y-Axis ({currentSensor.unit})</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-3">
                        {chartData[chartData.length - 1]?.z_axis?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-muted-foreground">Z-Axis ({currentSensor.unit})</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-4">
                        {chartData[chartData.length - 1]?.magnitude?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-muted-foreground">Magnitude ({currentSensor.unit})</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-chart-1">
                      {chartData[chartData.length - 1]?.value?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-muted-foreground">Current {currentSensor.name} ({currentSensor.unit})</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SensorDetail;