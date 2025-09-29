import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { generateMockSensorData, findDataGaps, type MockSensorReading } from '@/utils/mockDataGenerator';
import { startOfDay, endOfDay, subDays } from 'date-fns';
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
      
      console.log(`📊 [CONSISTENCY] Raw processed_sensor_readings data: ${data?.length || 0} records`);
      console.log(`📊 [CONSISTENCY] Latest record: ${data?.[0]?.recorded_at || 'None'}`);
      
      // Use raw data only - no gap filling for individual sensor readings to ensure consistency
      setSensorReadings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sensor readings');
    }
  };

  // Fill data gaps with mock data
  const fillDataGaps = async (existingData: SensorReading[]): Promise<SensorReading[]> => {
    if (existingData.length === 0) return existingData;

    // Check for gaps in the last 30 days
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    const gaps = findDataGaps(existingData, thirtyDaysAgo, now);
    
    if (gaps.length === 0) {
      console.log('📊 No data gaps found');
      return existingData;
    }

    console.log(`📊 Found ${gaps.length} data gaps:`, gaps);
    
    // Generate mock data for each gap
    let mockData: MockSensorReading[] = [];
    gaps.forEach(gap => {
      const gapMock = generateMockSensorData(gap.start, gap.end, 60); // 60 readings per hour (1-minute intervals)
      mockData = [...mockData, ...gapMock];
    });

    // Convert mock data to SensorReading format and merge
    const mockSensorReadings: SensorReading[] = mockData.map((mock, index) => ({
      id: 999000 + index, // Use high IDs to avoid conflicts
      original_id: mock.original_id,
      recorded_at: mock.recorded_at,
      location: mock.location,
      temperature: mock.temperature,
      humidity: mock.humidity,
      pressure: mock.pressure,
      gas_resistance: mock.gas_resistance,
      pm1_0: mock.pm1_0,
      pm2_5: mock.pm2_5,
      pm10: mock.pm10,
      accel_x: mock.accel_x,
      accel_y: mock.accel_y,
      accel_z: mock.accel_z,
      accel_magnitude: mock.accel_magnitude,
      gyro_x: mock.gyro_x,
      gyro_y: mock.gyro_y,
      gyro_z: mock.gyro_z,
      gyro_magnitude: mock.gyro_magnitude,
      anomaly_score: mock.anomaly_score,
      predicted_failure_probability: mock.predicted_failure_probability,
      maintenance_recommendation: mock.maintenance_recommendation,
      quality_score: mock.quality_score,
      processed_at: mock.recorded_at,
      created_at: mock.recorded_at,
      updated_at: mock.recorded_at,
      processing_version: mock.processing_version
    }));

    console.log(`📊 Generated ${mockSensorReadings.length} mock readings to fill gaps`);

    // Merge and sort all data
    const allData = [...existingData, ...mockSensorReadings];
    return allData.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
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

  const fillMockGaps = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fill-mock-gaps');
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill mock gaps');
      throw err;
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

  const getSensorReadingsByTimeRange = useCallback(async (hours: number = 24) => {
    try {
      let startTime: Date;
      let endTime: Date;
      
      // Always use current time as end point for better real-time experience
      endTime = new Date();
      startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      
      console.log(`⏱️ [DEBUG] ${hours}h window: ${startTime.toISOString()} to ${endTime.toISOString()}`);
      
      // Check if we have recent data in the database first
      const { data: recentCheck, error: recentError } = await supabase
        .from('processed_sensor_readings')
        .select('recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1);
        
      if (recentError) throw recentError;
      
      const hasRecentData = recentCheck && recentCheck.length > 0;
      const mostRecentTime = hasRecentData ? new Date(recentCheck[0].recorded_at) : null;
      
      console.log(`🔍 [DEBUG] Most recent data in DB: ${mostRecentTime?.toISOString() || 'None'}`);
      
      // If no recent data or data is old, return empty dataset instead of showing old data
      if (!hasRecentData || (mostRecentTime && (endTime.getTime() - mostRecentTime.getTime()) > 24 * 60 * 60 * 1000)) {
        console.log(`📅 [DEBUG] Data is outdated, returning empty dataset to show no data available`);
        return [];
      }
      
      // For longer periods, use pagination to ensure we get all data
      if (hours > 24) {
        const pageSize = 1000;
        let from = 0;
        let to = pageSize - 1;
        let allData: any[] = [];

        while (true) {
          const { data, error } = await supabase
            .from('processed_sensor_readings')
            .select('*')
            .gte('recorded_at', startTime.toISOString())
            .lte('recorded_at', endTime.toISOString())
            .order('recorded_at', { ascending: true })
            .range(from, to);

          if (error) throw error;
          const batchCount = data?.length || 0;
          allData = allData.concat(data || []);
          console.log(`📦 [DEBUG] Fetched batch ${from}-${to} (${batchCount} rows), total so far: ${allData.length}`);

          if (batchCount < pageSize) break;
          from += pageSize;
          to += pageSize;
          if (from > 200000) { // safety guard for very large datasets
            console.warn('⚠️ [DEBUG] Stopping pagination after 200k rows to avoid runaway requests');
            break;
          }
        }

        // Sort and return only real data
        allData = allData.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
        console.log(`📈 [DEBUG] Total time range data fetched (real only): ${allData.length} records`);
        return allData;
      } else {
        // For short periods, use single query with reasonable limit
        const { data, error } = await supabase
          .from('processed_sensor_readings')
          .select('*')
          .gte('recorded_at', startTime.toISOString())
          .lte('recorded_at', endTime.toISOString())
          .order('recorded_at', { ascending: true })
          .limit(10000);

        if (error) throw error;
        console.log(`📈 [DEBUG] Short time range data fetched: ${data?.length || 0} records`);
        const allData = (data || []).sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
        return allData;
      }
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
      
      // Use same approach as getSensorReadingsByTimeRange - get most recent and go back 24h
      const { data: recentData, error: recentError } = await supabase
        .from('processed_sensor_readings')
        .select('recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1);
        
      if (recentError) throw recentError;
      
      if (!recentData || recentData.length === 0) {
        console.log(`⚠️ [DEBUG] No data found in processed_sensor_readings table`);
        return [];
      }
      
      const mostRecentTime = new Date(recentData[0].recorded_at);
      const endTime = mostRecentTime;
      const startTime = new Date(mostRecentTime.getTime() - 24 * 60 * 60 * 1000);

      console.log(`⏰ [DEBUG] Time window (treating as SG time): ${startTime.toISOString()} to ${endTime.toISOString()}`);

      // Fetch readings from processed_sensor_readings with pagination (PostgREST default limit ~1000)
      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let allData: any[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('processed_sensor_readings')
          .select(`recorded_at, ${sensorColumn}`)
          .not(sensorColumn, 'is', null)
          .gte('recorded_at', startTime.toISOString())
          .lte('recorded_at', endTime.toISOString())
          .order('recorded_at', { ascending: true })
          .range(from, to);

        if (error) throw error;
        const batchCount = data?.length || 0;
        allData = allData.concat(data || []);
        console.log(`📦 [DEBUG] Fetched batch ${from}-${to} (${batchCount} rows), total so far: ${allData.length}`);

        if (batchCount < pageSize) break;
        from += pageSize;
        to += pageSize;
        if (from > 100000) { // safety guard
          console.warn('⚠️ [DEBUG] Stopping pagination after 100k rows to avoid runaway requests');
          break;
        }
      }

      console.log(`📈 [DEBUG] Raw data fetched total: ${allData.length} records`);
      if (allData && allData.length > 0) {
        console.log(`📈 [DEBUG] First record time: ${allData[0]?.recorded_at}`);
        console.log(`📈 [DEBUG] Last record time: ${allData[allData.length - 1]?.recorded_at}`);
      }

      // Optional: peek at latest records to ensure window alignment
      try {
        const { data: broadData } = await supabase
          .from('processed_sensor_readings')
          .select(`recorded_at, ${sensorColumn}`)
          .not(sensorColumn, 'is', null)
          .order('recorded_at', { ascending: false })
          .limit(5);
        if (broadData) {
          console.log(`🔍 [DEBUG] Latest 5 records in DB:`, broadData.map(r => r.recorded_at));
        }
      } catch {}


      // Group by hour buckets - data is already in Singapore time
      const hourlyData = new Map<string, { values: number[]; hour_bucket: string }>();

      allData?.forEach((row: any) => {
        const recordTime = new Date(row.recorded_at);
        // Create hour bucket key (already in Singapore time)
        const hourKey = recordTime.getFullYear() + '-' + 
                       (recordTime.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                       recordTime.getDate().toString().padStart(2, '0') + ' ' + 
                       recordTime.getHours().toString().padStart(2, '0') + ':00:00';
                       
        if (!hourlyData.has(hourKey)) {
          hourlyData.set(hourKey, { values: [], hour_bucket: hourKey });
        }
        hourlyData.get(hourKey)!.values.push(Number(row[sensorColumn]));
      });

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
        console.log(`📊 [DEBUG] Sample result:`, result.slice(0, 3));
      }

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

  // Helper function to aggregate mock data
  const aggregateMockData = (mockData: MockSensorReading[], level: 'day' | 'week' | 'month') => {
    const groups: { [key: string]: MockSensorReading[] } = {};

    mockData.forEach(reading => {
      const date = new Date(reading.recorded_at);
      let key: string;

      if (level === 'day') {
        key = startOfDay(date).toISOString();
      } else if (level === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = startOfDay(weekStart).toISOString();
      } else { // month
        key = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(reading);
    });

    return Object.entries(groups).map(([time_bucket, readings]) => ({
      time_bucket,
      aggregation_level: level,
      location: 'hangar_01',
      avg_temperature: readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length,
      avg_humidity: readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length,
      avg_pressure: readings.reduce((sum, r) => sum + r.pressure, 0) / readings.length,
      avg_gas_resistance: readings.reduce((sum, r) => sum + r.gas_resistance, 0) / readings.length,
      avg_pm1_0: readings.reduce((sum, r) => sum + r.pm1_0, 0) / readings.length,
      avg_pm2_5: readings.reduce((sum, r) => sum + r.pm2_5, 0) / readings.length,
      avg_pm10: readings.reduce((sum, r) => sum + r.pm10, 0) / readings.length,
      avg_accel_magnitude: readings.reduce((sum, r) => sum + r.accel_magnitude, 0) / readings.length,
      avg_gyro_magnitude: readings.reduce((sum, r) => sum + r.gyro_magnitude, 0) / readings.length,
      min_temperature: Math.min(...readings.map(r => r.temperature)),
      max_temperature: Math.max(...readings.map(r => r.temperature)),
      data_points_count: readings.length
    }));
  };
 
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
    fillMockGaps,
    populateMockData,
    getSensorReadingsByTimeRange,
    getHourlyAveragedData,
    getAnomalousSensorReadings,
    getAggregatedSensorData,
  };
}