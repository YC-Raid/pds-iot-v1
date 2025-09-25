import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { subHours, subDays } from 'date-fns';

interface SensorReading {
  id: number;
  original_id: number;
  recorded_at: string;
  location: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  gas_resistance: number | null;
  pm1_0: number | null;
  pm2_5: number | null;
  pm10: number | null;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  accel_magnitude: number | null;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  gyro_magnitude: number | null;
  anomaly_score: number | null;
  predicted_failure_probability: number | null;
  maintenance_recommendation: string | null;
  quality_score: number | null;
  processed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  processing_version: string | null;
}

interface DashboardData {
  location: string;
  total_readings: number;
  avg_temperature: number;
  avg_humidity: number;
  avg_pressure: number;
  avg_pm25: number;
  avg_anomaly_score: number;
  avg_failure_risk: number;
  last_reading: string;
  high_anomaly_count: number;
  high_risk_count: number;
}

export const useSensorData = () => {
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorReadings = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      setSensorReadings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sensor readings');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_dashboard_live')
        .select('*');

      if (error) throw error;
      setDashboardData(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    }
  };

  const syncRDSData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-rds-data');
      
      if (error) throw error;
      
      // Store sync time in localStorage for persistence
      const now = new Date();
      localStorage.setItem('lastSyncTime', now.toISOString());
      
      // Refresh data after sync
      await fetchSensorReadings();
      await fetchDashboardData();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync RDS data');
      throw err;
    }
  };

  const getSensorReadingsByTimeRange = async (hours = 24, aggregation?: 'hour' | 'day' | 'week' | 'month') => {
    try {
      setIsLoading(true);
      
      if (aggregation) {
        return await getAggregatedSensorData(aggregation, hours);
      }
      
      // For raw data, fetch from processed_sensor_readings only
      const startTime = subHours(new Date(), hours).toISOString();
      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select('*')
        .gte('recorded_at', startTime)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching sensor readings by time range:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getAggregatedSensorData = async (level: 'hour' | 'day' | 'week' | 'month', hours: number) => {
    try {
      const startTime = subHours(new Date(), hours).toISOString();
      const { data, error } = await supabase
        .from('sensor_readings_aggregated')
        .select('*')
        .eq('aggregation_level', level)
        .gte('time_bucket', startTime)
        .order('time_bucket', { ascending: true });

      if (error) throw error;
      
      // Convert aggregated data to match the SensorReading interface
      return (data || []).map(item => ({
        id: Math.random(), // Temporary ID for aggregated data
        recorded_at: item.time_bucket,
        temperature: item.avg_temperature,
        humidity: item.avg_humidity,
        pressure: item.avg_pressure,
        gas_resistance: item.avg_gas_resistance,
        pm1_0: Math.round(item.avg_pm1_0 || 0),
        pm2_5: Math.round(item.avg_pm2_5 || 0),
        pm10: Math.round(item.avg_pm10 || 0),
        accel_magnitude: item.avg_accel_magnitude,
        gyro_magnitude: item.avg_gyro_magnitude,
        anomaly_score: 0,
        predicted_failure_probability: 0,
        location: item.location || 'hangar_01',
        original_id: 0,
        accel_x: 0,
        accel_y: 0,
        accel_z: 0,
        gyro_x: 0,
        gyro_y: 0,
        gyro_z: 0,
        maintenance_recommendation: null,
        quality_score: 100,
        processed_at: item.time_bucket,
        created_at: item.created_at,
        updated_at: item.created_at,
        processing_version: 'aggregated'
      }));
    } catch (err) {
      console.error('Error fetching aggregated sensor data:', err);
      return [];
    }
  };

  const getHourlyAveragedData = useCallback(async (sensorType: string) => {
    try {
      console.log(`📊 [DEBUG] Starting getHourlyAveragedData for sensor: ${sensorType}`);
      
      // Map sensor type to database column
      const sensorColumnMap = {
        'temperature': 'temperature',
        'humidity': 'humidity', 
        'pressure': 'pressure',
        'air-quality': 'pm2_5',
        'vibration': 'accel_magnitude'
      };
      
      const sensorColumn = sensorColumnMap[sensorType as keyof typeof sensorColumnMap] || 'temperature';
      
      // Get data from the last 24 hours
      const startTime = subHours(new Date(), 24).toISOString();
      
      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select(`recorded_at, ${sensorColumn}`)
        .not(sensorColumn, 'is', null)
        .gte('recorded_at', startTime)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      
      // Group by hour buckets
      const hourlyData = new Map<string, { values: number[]; hour_bucket: string }>();

      (data || []).forEach((row: any) => {
        const recordTime = new Date(row.recorded_at);
        // Create hour bucket key
        const hourKey = recordTime.getFullYear() + '-' + 
                       (recordTime.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                       recordTime.getDate().toString().padStart(2, '0') + ' ' + 
                       recordTime.getHours().toString().padStart(2, '0') + ':00:00';
                       
        if (!hourlyData.has(hourKey)) {
          hourlyData.set(hourKey, { values: [], hour_bucket: hourKey });
        }
        hourlyData.get(hourKey)!.values.push(Number(row[sensorColumn]));
      });

      // Return sorted buckets
      const result = Array.from(hourlyData.values())
        .map((bucket) => ({
          hour_bucket: bucket.hour_bucket,
          avg_value: bucket.values.reduce((s, v) => s + v, 0) / bucket.values.length,
          reading_count: bucket.values.length,
        }))
        .sort((a, b) => a.hour_bucket.localeCompare(b.hour_bucket));

      console.log(`📊 [DEBUG] Final result: ${result.length} hourly buckets`);
      return result;
    } catch (err) {
      console.error('❌ [DEBUG] Failed to fetch hourly averaged data:', err);
      return [];
    }
  }, []);

  const getAnomalousSensorReadings = async (threshold = 0.7) => {
    try {
      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select('*')
        .gte('anomaly_score', threshold)
        .order('anomaly_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch anomalous readings:', err);
      return [];
    }
  };

  // Legacy functions for compatibility (now no-ops)
  const fillMockGaps = async () => {
    console.log('Mock data functions disabled - using real data only');
    return { success: false, message: 'Mock data functionality disabled' };
  };

  const populateMockData = async () => {
    console.log('Mock data functions disabled - using real data only');
    return { success: false, message: 'Mock data functionality disabled' };
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchSensorReadings(), fetchDashboardData()]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    sensorReadings,
    dashboardData,
    isLoading,
    error,
    fetchSensorReadings,
    fetchDashboardData,
    syncRDSData,
    getSensorReadingsByTimeRange,
    getAggregatedSensorData,
    getHourlyAveragedData,
    getAnomalousSensorReadings,
    fillMockGaps,
    populateMockData
  };
};