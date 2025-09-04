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
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);
      
      console.log(`Fetching sensor data from ${startTime.toISOString()} to now`);

      const { data, error } = await supabase
        .from('processed_sensor_readings')
        .select('*')
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: true })
        .limit(1000); // Add limit to prevent large queries

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} sensor readings`);
      return data || [];
    } catch (err) {
      console.error('Failed to fetch time range data:', err);
      // Return empty array but don't throw to prevent UI breaking
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
        console.log('🚀 Performing initial RDS data sync...');
        await syncRDSData();
        console.log('✅ Initial sync completed');
      } catch (error) {
        console.error('❌ Initial sync failed:', error);
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

    // Auto-sync every 5 minutes - start immediately for testing
    console.log('⏰ Setting up auto-sync interval (5 minutes)');
    const autoSyncInterval = setInterval(async () => {
      try {
        console.log('🔄 Auto-syncing RDS data (5-min interval)...');
        const syncStartTime = new Date().toISOString();
        const result = await syncRDSData();
        console.log('✅ Auto-sync completed successfully', result);
        
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
        console.error('❌ Auto-sync failed:', error);
        
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
    getAnomalousSensorReadings,
    getAggregatedSensorData,
  };
}