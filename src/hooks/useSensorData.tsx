import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { generateMockSensorData, findDataGaps, type MockSensorReading } from '@/utils/mockDataGenerator';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { useDataSource } from '@/contexts/DataSourceContext';

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
  const { dataSource } = useDataSource();
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorReadings = async (limit = 100) => {
    try {
      // Only fetch data from the last 24 hours
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from(dataSource)
        .select('*')
        .gte('recorded_at', twentyFourHoursAgo.toISOString())
        .lte('recorded_at', now.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Show only real data - no mock augmentation for any data source
      console.log(`📊 [DEBUG] Fetched ${data?.length || 0} real readings from last 24h from ${dataSource}`);
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
      
      // For 1-hour view, use current time window (now -> now - 1h)
      if (hours <= 1) {
        endTime = new Date();
        startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
        console.log(`⏱️ [DEBUG] 1h window (now): ${startTime.toISOString()} to ${endTime.toISOString()}`);
      } else {
        // For longer periods, anchor to most recent reading in DB
        console.log(`🔍 [DEBUG] Getting most recent data for ${hours}-hour view`);
        
        // First, get the most recent timestamp
        const { data: recentData, error: recentError } = await supabase
          .from(dataSource)
          .select('recorded_at')
          .order('recorded_at', { ascending: false })
          .limit(1);
          
        if (recentError) throw recentError;
        
        if (!recentData || recentData.length === 0) {
          console.log(`⚠️ [DEBUG] No data found in ${dataSource} table`);
          return [];
        }
        
        const mostRecentTime = new Date(recentData[0].recorded_at);
        endTime = mostRecentTime;
        startTime = new Date(mostRecentTime.getTime() - hours * 60 * 60 * 1000);
        
        console.log(`🔍 [DEBUG] Fetching ${hours}-hour data from most recent: ${startTime.toISOString()} to ${endTime.toISOString()}`);
      }
      
      // For longer periods, use pagination to ensure we get all data
      if (hours > 24) {
        const pageSize = 1000;
        let from = 0;
        let to = pageSize - 1;
        let allData: any[] = [];

        while (true) {
          const { data, error } = await supabase
            .from(dataSource)
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
          if (from > 100000) { // safety guard
            console.warn('⚠️ [DEBUG] Stopping pagination after 100k rows to avoid runaway requests');
            break;
          }
        }

        console.log(`📊 [DEBUG] Fetched ${allData.length} readings for ${hours}-hour range from ${dataSource}`);

        return allData;
      } else {
        // For shorter periods, single query should suffice
        const { data, error } = await supabase
          .from(dataSource)
          .select('*')
          .gte('recorded_at', startTime.toISOString())
          .lte('recorded_at', endTime.toISOString())
          .order('recorded_at', { ascending: true });

        if (error) throw error;
        console.log(`📊 [DEBUG] Fetched ${data?.length || 0} readings for ${hours}-hour range`);
        return data || [];
      }
    } catch (err) {
      console.error('Failed to fetch sensor readings by time range:', err);
      return [];
    }
  }, [dataSource]);

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
      console.log(`📊 [DEBUG] Using sensor column: ${sensorColumn}`);
      
      // Use same approach as getSensorReadingsByTimeRange - get most recent and go back 24h
      const { data: recentData, error: recentError } = await supabase
        .from(dataSource)
        .select('recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1);
        
      if (recentError) throw recentError;
      
      if (!recentData || recentData.length === 0) {
        console.log(`⚠️ [DEBUG] No data found in ${dataSource} table`);
        return [];
      }
      
      const mostRecentTime = new Date(recentData[0].recorded_at);
      const endTime = mostRecentTime;
      const startTime = new Date(mostRecentTime.getTime() - 24 * 60 * 60 * 1000);

      console.log(`⏰ [DEBUG] Time window (treating as SG time): ${startTime.toISOString()} to ${endTime.toISOString()}`);

      // Fetch readings from current data source with pagination
      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let allData: any[] = [];

      while (true) {
        const { data, error } = await supabase
          .from(dataSource)
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
          .from(dataSource)
          .select(`recorded_at, ${sensorColumn}`)
          .not(sensorColumn, 'is', null)
          .order('recorded_at', { ascending: false })
          .limit(5);
        if (broadData) {
          console.log(`🔍 [DEBUG] Latest 5 records in DB:`, broadData.map((r: any) => r.recorded_at));
        }
      } catch {
        // Ignore errors when peeking at data
      }


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

      console.log(`📊 [DEBUG] Final result: ${result.length} hourly buckets`);
      if (result.length > 0) {
        console.log(`📊 [DEBUG] Sample result:`, result.slice(0, 3));
      }

      return result;
    } catch (err) {
      console.error('❌ [DEBUG] Failed to fetch hourly averaged data:', err);
      return [];
    }
  }, [dataSource]);

  const getAnomalousSensorReadings = async (threshold = 0.7) => {
    try {
      const { data, error } = await supabase
        .from(dataSource)
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
      
      // For processed_sensor_readings, show only real data without mock augmentation
      if (dataSource === 'processed_sensor_readings') {
        const { data, error } = await supabase
          .from('sensor_readings_aggregated')
          .select('*')
          .eq('aggregation_level', aggregationLevel)
          .gte('time_bucket', startDate.toISOString())
          .order('time_bucket', { ascending: true });
        
        if (error) throw error;
        return data || [];
      }
      
      // For mock_sensor_dataset, keep existing behavior with mock data generation
      const { data, error } = await supabase
        .from('sensor_readings_aggregated')
        .select('*')
        .eq('aggregation_level', aggregationLevel)
        .gte('time_bucket', startDate.toISOString())
        .order('time_bucket', { ascending: true });
      
      if (error) throw error;
      
      const existingData = data || [];
      
      // For aggregated data, if we have significant gaps, generate mock aggregated data
      if (existingData.length < Math.floor(days * 0.7)) { // If less than 70% coverage
        console.log(`📊 Low coverage for ${aggregationLevel} data (${existingData.length}/${days}), generating mock aggregates`);
        
        const endDate = new Date();
        
        // Generate mock raw data to create aggregates from
        const mockRawData = generateMockSensorData(startDate, endDate, 12);
        
        // Aggregate mock data by the requested level
        const mockAggregates = aggregateMockData(mockRawData, aggregationLevel);
        
        // Merge with existing data, preferring real data over mock
        const existingDates = new Set(existingData.map(d => d.time_bucket));
        const uniqueMockAggregates = mockAggregates.filter(mock => 
          !existingDates.has(mock.time_bucket)
        );
        
        const allData = [...existingData, ...uniqueMockAggregates];
        console.log(`📊 Returning ${allData.length} aggregated records (${existingData.length} real + ${uniqueMockAggregates.length} mock)`);
        
        return allData.sort((a, b) => new Date(a.time_bucket).getTime() - new Date(b.time_bucket).getTime());
      }
      
      return existingData;
    } catch (err) {
      console.error('Failed to fetch aggregated sensor data:', err);
      return [];
    }
  }, [dataSource]);

  // Helper function to aggregate mock data by level
  const aggregateMockData = (mockData: MockSensorReading[], level: 'day' | 'week' | 'month') => {
    const groups: { [key: string]: MockSensorReading[] } = {};
    
    mockData.forEach(reading => {
      const date = new Date(reading.recorded_at);
      let key: string;
      
      switch (level) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = date.toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
          break;
        default:
          key = date.toISOString().split('T')[0];
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
      .channel('sensor-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: dataSource
        },
        (payload) => {
          console.log('Sensor data changed:', payload);
          // Refresh data when changes occur
          fetchSensorReadings();
          fetchDashboardData();
        }
      )
      .subscribe();

    // Only perform initial sync and auto-sync for processed_sensor_readings (RDS data)
    if (dataSource === 'processed_sensor_readings') {
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

      // Auto-sync every 5 minutes for RDS data only
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
        clearTimeout(initialSyncTimeout);
        clearInterval(autoSyncInterval);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dataSource]); // Add dataSource as dependency to re-run when it changes

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