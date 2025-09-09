import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
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
  anomaly_score: number;
  predicted_failure_probability: number;
  maintenance_recommendation: string | null;
  quality_score: number;
  processed_at: string;
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

export function useSensorData() {
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

  const getSensorReadingsByTimeRange = useCallback(async (hours: number = 24) => {
    try {
      // Calculate time range in UTC but know that recorded_at represents Singapore local time
      const now = new Date();
      const startTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
      
      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select('*')
        .gte('recorded_at', startTime.toISOString())
        .lte('recorded_at', now.toISOString())
        .order('recorded_at', { ascending: true })
        .limit(50000);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch time range data:', err);
      return [];
    }
  }, []);

  const getHourlyAveragedData = useCallback(async (sensorType: string): Promise<Array<{hour_bucket: string, avg_value: number, reading_count: number}>> => {
    try {
      console.log(`🚀 [DEBUG] Starting getHourlyAveragedData for: ${sensorType}`);
      
      // Map sensor type to column in processed_sensor_readings
      const sensorColumnMap = {
        'temperature': 'temperature',
        'humidity': 'humidity', 
        'pressure': 'pressure',
        'gas': 'gas_resistance',
        'pm1': 'pm1_0',
        'pm25': 'pm2_5',
        'pm10': 'pm10'
      } as const;
      
      const sensorColumn = sensorColumnMap[sensorType as keyof typeof sensorColumnMap] || 'temperature';
      console.log(`📊 [DEBUG] Using sensor column: ${sensorColumn}`);
      
      // Compute SG time window: current SG hour minus 24h to current SG hour
      const nowUtc = new Date();
      const nowSg = toZonedTime(nowUtc, 'Asia/Singapore');
      // Round down to current hour, then subtract exactly 24 hours
      const endSg = new Date(nowSg);
      endSg.setMinutes(0, 0, 0); // Round to current hour
      const startSg = new Date(endSg.getTime() - 24 * 60 * 60 * 1000);

      console.log(`⏰ [DEBUG] SG Time window: ${startSg.toISOString()} to ${endSg.toISOString()}`);

      // Fetch readings from processed_sensor_readings within 26 hours to be safe, then filter client-side by SG window
      const { data: rawData, error } = await supabase
        .from('processed_sensor_readings')
        .select(`recorded_at, ${sensorColumn}`)
        .not(sensorColumn, 'is', null)
        .gte('recorded_at', new Date(nowUtc.getTime() - 26 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: true })
        .limit(50000);

      if (error) throw error;

      console.log(`📈 [DEBUG] Raw data fetched: ${rawData?.length || 0} records`);
      if (rawData && rawData.length > 0) {
        console.log(`📈 [DEBUG] Sample raw data:`, rawData.slice(0, 2));
        console.log(`📈 [DEBUG] Last raw data:`, rawData.slice(-2));
      }

      // Group by SG hour buckets
      const hourlyData = new Map<string, { values: number[]; hour_bucket: string }>();
      let totalProcessed = 0;
      let withinWindow = 0;

      rawData?.forEach((row: any) => {
        totalProcessed++;
        const utcDate = new Date(row.recorded_at);
        const sgDate = toZonedTime(utcDate, 'Asia/Singapore');
        
        // Debug first few records
        if (totalProcessed <= 3) {
          console.log(`🔍 [DEBUG] Record ${totalProcessed}: UTC=${utcDate.toISOString()}, SG=${sgDate.toISOString()}, within window=${sgDate >= startSg && sgDate <= endSg}`);
        }
        
        if (sgDate >= startSg && sgDate <= endSg) {
          withinWindow++;
          const hourKey = formatInTimeZone(sgDate, 'Asia/Singapore', 'yyyy-MM-dd HH:00:00');
          if (!hourlyData.has(hourKey)) {
            hourlyData.set(hourKey, { values: [], hour_bucket: hourKey });
          }
          hourlyData.get(hourKey)!.values.push(Number(row[sensorColumn]));
        }
      });

      console.log(`🗂️ [DEBUG] Processed ${totalProcessed} records, ${withinWindow} within time window`);
      console.log(`🗂️ [DEBUG] Hour buckets created: ${hourlyData.size}`);
      console.log(`🗂️ [DEBUG] Hour bucket keys:`, Array.from(hourlyData.keys()).sort());

      // Return sorted buckets
      const result = Array.from(hourlyData.values())
        .map((bucket) => ({
          hour_bucket: bucket.hour_bucket,
          avg_value: bucket.values.reduce((s, v) => s + v, 0) / bucket.values.length,
          reading_count: bucket.values.length,
        }))
        .sort((a, b) => a.hour_bucket.localeCompare(b.hour_bucket));

      console.log(`✅ [DEBUG] Returning ${result.length} hourly averages`);
      if (result.length > 0) {
        console.log(`📊 [DEBUG] Sample result:`, result.slice(0, 2));
      }

      return result;
    } catch (err) {
      console.error('❌ [DEBUG] Failed to fetch hourly averaged data (processed):', err);
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
      return data || [];
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

    // Perform initial sync when component mounts
    const performInitialSync = async () => {
      try {
        await syncRDSData();
      } catch (error) {
        console.error('Initial sync failed:', error);
      }
    };

    // Trigger initial sync after a short delay
    const initialSyncTimeout = setTimeout(performInitialSync, 2000);

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

    // Auto-sync every 5 minutes
    const autoSyncInterval = setInterval(async () => {
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

    return () => {
      supabase.removeChannel(channel);
      clearInterval(autoSyncInterval);
      clearTimeout(initialSyncTimeout);
    };
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
    getHourlyAveragedData,
    getAnomalousSensorReadings,
    getAggregatedSensorData,
  };
}