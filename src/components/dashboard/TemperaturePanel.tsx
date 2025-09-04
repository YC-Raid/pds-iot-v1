import { useEffect, useState, useMemo } from "react";
import { Thermometer } from "lucide-react";
import { EnhancedSensorChart, SensorConfig, DataPoint } from "./EnhancedSensorChart";
import { useSensorData } from "@/hooks/useSensorData";
import { calculateDynamicThresholds } from "@/utils/dynamicThresholds";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TemperaturePanel = () => {
  const { getSensorReadingsByTimeRange, getAggregatedSensorData, isLoading } = useSensorData();
  const [temperatureData, setTemperatureData] = useState<DataPoint[]>([]);
  const [timeRange, setTimeRange] = useState('24');

  // Calculate dynamic thresholds based on collected data
  const dynamicConfig = useMemo(() => {
    const dataPoints = temperatureData.map(d => ({
      value: d.value,
      timestamp: d.timestamp
    }));
    
    const thresholdResult = calculateDynamicThresholds(dataPoints, 'temperature', 3);
    
    return {
      thresholds: thresholdResult.thresholds,
      optimalRange: thresholdResult.optimalRange,
      yAxisRange: thresholdResult.yAxisRange,
      statistics: thresholdResult.statistics
    };
  }, [temperatureData]);

  // Temperature sensor configuration with dynamic thresholds
  const temperatureConfig: SensorConfig = {
    name: "Temperature",
    unit: "°C", 
    icon: Thermometer,
    description: `Environmental temperature monitoring - Mean: ${dynamicConfig.statistics.mean.toFixed(1)}°C, Std: ${dynamicConfig.statistics.std.toFixed(1)}°C`,
    optimalRange: dynamicConfig.optimalRange,
    thresholds: dynamicConfig.thresholds,
    yAxisRange: dynamicConfig.yAxisRange
  };

  useEffect(() => {
    const loadTemperatureData = async () => {
      const hours = parseInt(timeRange);
      let processedData: DataPoint[] = [];

      if (hours <= 24) {
        // Use raw data for 1h/24h views
        const data = await getSensorReadingsByTimeRange(hours);
        const maxPoints = hours === 1 ? 60 : 200; // Show more points for 1 hour view
        
        const mapped = data
          .filter(reading => reading.temperature !== null)
          .map(reading => {
            const date = new Date(reading.recorded_at);
            let timeLabel = '';
            
            if (hours === 1) {
              // For 1 hour: show HH:MM format
              timeLabel = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Singapore'
              });
            } else {
              // For 24 hours: show HH:00 format (hourly)
              timeLabel = date.toLocaleTimeString('en-US', { 
                hour: '2-digit',
                hour12: false,
                timeZone: 'Asia/Singapore'
              }) + ':00';
            }
            
            return {
              time: timeLabel,
              value: reading.temperature || 0,
              timestamp: reading.recorded_at,
              _ts: date.getTime(),
            };
          });

        const step = Math.max(1, Math.ceil(mapped.length / maxPoints));
        processedData = mapped.filter((_, i) => i % step === 0 || i === mapped.length - 1);
      } else if (hours === 168) {
        // 1 week: Try aggregated data first, fallback to raw data
        let data = await getAggregatedSensorData('day', 7);
        
        if (data.length === 0) {
          // Fallback: use raw data and aggregate manually
          const rawData = await getSensorReadingsByTimeRange(168);
          const dailyGroups: Record<string, any[]> = {};
          
          rawData.filter(reading => reading.temperature !== null).forEach(reading => {
            const date = new Date(reading.recorded_at);
            const dateStr = date.toISOString().split('T')[0];
            if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
            dailyGroups[dateStr].push(reading);
          });
          
          data = Object.entries(dailyGroups).map(([dateStr, readings]) => ({
            time_bucket: dateStr + 'T00:00:00Z',
            avg_temperature: readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / readings.length,
          })) as any;
        }
        
        // Generate all dates for the past 7 days
        const allDates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          allDates.push(date.toISOString().split('T')[0]);
        }
        
        // Create map of existing data
        const dataMap: Record<string, any> = {};
        data.forEach((row: any) => {
          const date = new Date(row.time_bucket);
          const dateStr = date.toISOString().split('T')[0];
          dataMap[dateStr] = row;
        });
        
        // Backfill missing dates with 0 values
        processedData = allDates.map(dateStr => {
          const existing = dataMap[dateStr];
          const date = new Date(dateStr + 'T00:00:00');
          const label = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            timeZone: 'Asia/Singapore'
          });
          
          return {
            time: label,
            value: existing?.avg_temperature ?? 0,
            timestamp: dateStr + 'T00:00:00Z',
          };
        });
      } else if (hours === 720) {
        // 1 month: Try aggregated data first, fallback to raw data
        let data = await getAggregatedSensorData('day', 30);
        
        if (data.length === 0) {
          // Fallback: use raw data and aggregate manually
          const rawData = await getSensorReadingsByTimeRange(720);
          const dailyGroups: Record<string, any[]> = {};
          
          rawData.filter(reading => reading.temperature !== null).forEach(reading => {
            const date = new Date(reading.recorded_at);
            const dateStr = date.toISOString().split('T')[0];
            if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
            dailyGroups[dateStr].push(reading);
          });
          
          data = Object.entries(dailyGroups).map(([dateStr, readings]) => ({
            time_bucket: dateStr + 'T00:00:00Z',
            avg_temperature: readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / readings.length,
          })) as any;
        }
        
        // Group daily data into weeks
        const weeklyData: Record<string, any[]> = {};
        const currentDate = new Date();
        
        // Generate 4 weeks of data
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - (week * 7) - 6);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() - (week * 7));
          
          const weekKey = `Week ${4 - week}`;
          weeklyData[weekKey] = [];
          
          // Find data for this week
          data.forEach(row => {
            const rowDate = new Date(row.time_bucket);
            if (rowDate >= weekStart && rowDate <= weekEnd) {
              weeklyData[weekKey].push(row);
            }
          });
        }
        
        // Calculate averages for each week
        processedData = Object.entries(weeklyData).map(([weekLabel, weekData]) => {
          return {
            time: weekLabel,
            value: weekData.length > 0 
              ? weekData.reduce((sum, d) => sum + (d.avg_temperature || 0), 0) / weekData.length
              : 0,
            timestamp: weekLabel,
          };
        });
      }

      setTemperatureData(processedData);
    };

    if (!isLoading) {
      loadTemperatureData();
    }
  }, [getSensorReadingsByTimeRange, getAggregatedSensorData, isLoading, timeRange]);

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
    <div className="space-y-6">
      <EnhancedSensorChart
        data={temperatureData}
        config={temperatureConfig}
        title={`Temperature Monitoring - ${getTimeRangeLabel()} Analysis`}
        timeRange={getTimeRangeLabel()}
        isLoading={isLoading}
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
  );
};

export { TemperaturePanel };