import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  // Door security fields
  door_status: string | null;
  door_opens: number | null;
  door_closes: number | null;
  intrusion_alert: boolean | null;
  door_opened_at: string | null;
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

// Utility function to check if data is fresh (less than 10 minutes old)
export function isDataFresh(timestamp: string, thresholdMinutes = 10): boolean {
  const now = new Date();
  const dataTime = new Date(timestamp);
  const diffMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);
  return diffMinutes <= thresholdMinutes;
}

interface UseSensorDataOptions {
  autoSync?: boolean;
}

let syncRDSInFlight: Promise<any> | null = null;

export function useSensorData({ autoSync = false }: UseSensorDataOptions = {}) {
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorReadings = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      console.log(`📊 [CONSISTENCY] Raw processed_sensor_readings data: ${data?.length || 0} records`);
      console.log(`📊 [CONSISTENCY] Latest record: ${data?.[0]?.recorded_at || 'None'}`);
      
      // Use raw data only - no gap filling for individual sensor readings to ensure consistency
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
    if (syncRDSInFlight) {
      return syncRDSInFlight;
    }

    syncRDSInFlight = (async () => {
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
    })();

    try {
      return await syncRDSInFlight;
    } finally {
      syncRDSInFlight = null;
    }
  };


  const populateMockData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('populate-mock-data');
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to populate mock data');
      throw err;
    }
  };

  // Helper: map aggregated row to raw-like format for compatibility with existing chart formatting
  const mapAggregatedToRaw = (row: any) => ({
    recorded_at: row.time_bucket,
    temperature: row.avg_temperature,
    humidity: row.avg_humidity,
    pressure: row.avg_pressure,
    gas_resistance: row.avg_gas_resistance,
    pm1_0: row.avg_pm1_0,
    pm2_5: row.avg_pm2_5,
    pm10: row.avg_pm10,
    accel_magnitude: row.avg_accel_magnitude,
    gyro_magnitude: row.avg_gyro_magnitude,
    accel_x: row.avg_accel_x ?? null,
    accel_y: row.avg_accel_y ?? null,
    accel_z: row.avg_accel_z ?? null,
    gyro_x: row.avg_gyro_x ?? null,
    gyro_y: row.avg_gyro_y ?? null,
    gyro_z: row.avg_gyro_z ?? null,
    location: row.location,
    // Keep aggregated fields too for isAggregated detection
    avg_temperature: row.avg_temperature,
    avg_humidity: row.avg_humidity,
    avg_pressure: row.avg_pressure,
    avg_gas_resistance: row.avg_gas_resistance,
    avg_pm1_0: row.avg_pm1_0,
    avg_pm2_5: row.avg_pm2_5,
    avg_pm10: row.avg_pm10,
    avg_accel_magnitude: row.avg_accel_magnitude,
    avg_gyro_magnitude: row.avg_gyro_magnitude,
    time_bucket: row.time_bucket,
    data_points_count: row.data_points_count,
    aggregation_level: row.aggregation_level,
  });

  const getSensorReadingsByTimeRange = useCallback(async (hours: number = 24) => {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      
      console.log(`⏱️ [DEBUG] ${hours}h window: ${startTime.toISOString()} to ${endTime.toISOString()}`);

      // Determine the best aggregation tier based on time range
      // 1h → try raw first, fallback to 1min aggregates
      // 24h → hourly aggregates
      // 7d+ → daily aggregates
      
      if (hours <= 2) {
        // Try raw data first
        const { data: rawData, error: rawError } = await supabase
          .from('processed_sensor_readings')
          .select('*')
          .gte('recorded_at', startTime.toISOString())
          .lte('recorded_at', endTime.toISOString())
          .order('recorded_at', { ascending: true })
          .limit(10000);

        if (!rawError && rawData && rawData.length >= 10) {
          console.log(`📈 [DEBUG] Using ${rawData.length} raw records for ${hours}h view`);
          return rawData;
        }

        // Fallback to 1min aggregates
        console.log(`⚠️ [DEBUG] Raw data insufficient (${rawData?.length || 0}), falling back to 1min aggregates`);
        const { data: aggData, error: aggError } = await supabase
          .from('sensor_readings_aggregated')
          .select('*')
          .eq('aggregation_level', '1min')
          .gte('time_bucket', startTime.toISOString())
          .lte('time_bucket', endTime.toISOString())
          .order('time_bucket', { ascending: true })
          .limit(10000);

        if (aggError) throw aggError;
        console.log(`📈 [DEBUG] Using ${aggData?.length || 0} 1min aggregated records for ${hours}h view`);
        return (aggData || []).map(mapAggregatedToRaw);
      }
      
      if (hours <= 36) {
        // Use hourly aggregates for 24h view
        const { data: aggData, error: aggError } = await supabase
          .from('sensor_readings_aggregated')
          .select('*')
          .eq('aggregation_level', 'hour')
          .gte('time_bucket', startTime.toISOString())
          .lte('time_bucket', endTime.toISOString())
          .order('time_bucket', { ascending: true })
          .limit(1000);

        if (aggError) throw aggError;
        console.log(`📈 [DEBUG] Using ${aggData?.length || 0} hourly aggregated records for ${hours}h view`);
        return (aggData || []).map(mapAggregatedToRaw);
      }
      
      // 7d+ → use daily aggregates
      const { data: aggData, error: aggError } = await supabase
        .from('sensor_readings_aggregated')
        .select('*')
        .eq('aggregation_level', 'day')
        .gte('time_bucket', startTime.toISOString())
        .lte('time_bucket', endTime.toISOString())
        .order('time_bucket', { ascending: true })
        .limit(1000);

      if (aggError) throw aggError;
      console.log(`📈 [DEBUG] Using ${aggData?.length || 0} daily aggregated records for ${hours}h+ view`);
      return (aggData || []).map(mapAggregatedToRaw);
    } catch (err) {
      console.error('Failed to fetch time range data:', err);
      return [];
    }
  }, []);

  const getHourlyAveragedData = useCallback(async (sensorType: string): Promise<Array<{hour_bucket: string, avg_value: number, reading_count: number}>> => {
    try {
      console.log(`🚀 [DEBUG] Starting getHourlyAveragedData for: ${sensorType}`);
      
      const sensorColumnMap = {
        'temperature': 'avg_temperature',
        'humidity': 'avg_humidity', 
        'pressure': 'avg_pressure',
        'gas': 'avg_gas_resistance',
        'pm1': 'avg_pm1_0',
        'pm25': 'avg_pm2_5',
        'pm10': 'avg_pm10'
      } as const;
      
      const aggColumn = sensorColumnMap[sensorType as keyof typeof sensorColumnMap] || 'avg_temperature';
      
      // Get last 24 hours of hourly aggregated data
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('sensor_readings_aggregated')
        .select('*')
        .eq('aggregation_level', 'hour')
        .gte('time_bucket', startTime.toISOString())
        .lte('time_bucket', endTime.toISOString())
        .order('time_bucket', { ascending: true });

      if (error) throw error;
      
      console.log(`📈 [DEBUG] Fetched ${data?.length || 0} hourly aggregated records`);
      
      const result = (data || [])
        .filter(row => row[aggColumn] !== null)
        .map(row => ({
          hour_bucket: new Date(row.time_bucket).getFullYear() + '-' + 
            (new Date(row.time_bucket).getMonth() + 1).toString().padStart(2, '0') + '-' + 
            new Date(row.time_bucket).getDate().toString().padStart(2, '0') + ' ' + 
            new Date(row.time_bucket).getHours().toString().padStart(2, '0') + ':00:00',
          avg_value: Number(row[aggColumn]),
          reading_count: row.data_points_count || 0,
        }));
      
      console.log(`✅ [DEBUG] Returning ${result.length} hourly averages from aggregated data`);
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

  const getAggregatedSensorData = useCallback(async (aggregationLevel: 'day' | 'week' | 'month', days: number) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('sensor_readings_aggregated')
        .select('*')
        .eq('aggregation_level', aggregationLevel)
        .gte('time_bucket', startDate.toISOString())
        .order('time_bucket', { ascending: true });
      
      if (error) throw error;
      
      const existingData = data || [];
      
      // Return only existing aggregated data (no mock generation)


      return existingData;
    } catch (err) {
      console.error('Failed to fetch aggregated sensor data:', err);
      return [];
    }
  }, []);

 
  // Function removed - now using sensorReadings[0].temperature directly

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchSensorReadings(),
          fetchDashboardData()
        ]);
      } catch (err) {
        // Error already set by individual functions
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time subscription for new sensor data
    const channel = supabase
      .channel('processed-sensor-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processed_sensor_readings'
        },
        (payload) => {
          console.log('Sensor data changed:', payload);
          // Refresh data when changes occur
          fetchSensorReadings();
          fetchDashboardData();
        }
      )
      .subscribe();

    let initialSyncTimeout: ReturnType<typeof setTimeout> | null = null;
    let autoSyncInterval: ReturnType<typeof setInterval> | null = null;

    if (autoSync) {
      // Perform initial sync when component mounts
      const performInitialSync = async () => {
        try {
          await syncRDSData();
        } catch (error) {
          console.error('Initial sync failed:', error);
        }
      };

      // Trigger initial sync after a short delay
      initialSyncTimeout = setTimeout(performInitialSync, 2000);

      // Auto-sync every 5 minutes
      autoSyncInterval = setInterval(async () => {
        try {
          const syncStartTime = new Date().toISOString();
          const result = await syncRDSData();

          // Store sync time even if no new records
          localStorage.setItem('lastSyncTime', syncStartTime);

          // Show notification with sync details
          const syncedCount = result.synced_count || 0;
          toast({
            title: "Data Sync Complete",
            description: `Synced ${syncedCount} new records from AWS RDS`,
            duration: 3000,
          });
        } catch (error) {
          console.error('Auto-sync failed:', error);

          // Show error notification for failed sync
          toast({
            title: "Sync Failed",
            description: "Failed to sync data from AWS RDS. Will retry in 5 minutes.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      supabase.removeChannel(channel);
      if (autoSyncInterval) clearInterval(autoSyncInterval);
      if (initialSyncTimeout) clearTimeout(initialSyncTimeout);
    };
  }, [autoSync]);

  return {
    sensorReadings,
    dashboardData,
    isLoading,
    error,
    fetchSensorReadings,
    fetchDashboardData,
    syncRDSData,
    populateMockData,
    getSensorReadingsByTimeRange,
    getHourlyAveragedData,
    getAnomalousSensorReadings,
    getAggregatedSensorData,
  };
}