import { useEffect, useState, useMemo } from "react";
import { Thermometer } from "lucide-react";
import { EnhancedSensorChart, SensorConfig, DataPoint } from "./EnhancedSensorChart";
import { useSensorData } from "@/hooks/useSensorData";
import { calculateDynamicThresholds } from "@/utils/dynamicThresholds";

const TemperaturePanel = () => {
  const { getSensorReadingsByTimeRange, isLoading } = useSensorData();
  const [temperatureData, setTemperatureData] = useState<DataPoint[]>([]);

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
      const data = await getSensorReadingsByTimeRange(24); // Last 24 hours
      
      // Process temperature data for the chart
      const processedData: DataPoint[] = data
        .filter(reading => reading.temperature !== null)
        .map(reading => ({
          time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          value: reading.temperature || 0,
          timestamp: reading.recorded_at
        }))
        .slice(-50); // Show last 50 readings for better chart performance

      setTemperatureData(processedData);
    };

    if (!isLoading) {
      loadTemperatureData();
    }
  }, [getSensorReadingsByTimeRange, isLoading]);

  return (
    <div className="space-y-6">
      <EnhancedSensorChart
        data={temperatureData}
        config={temperatureConfig}
        title="Temperature Monitoring - 24 Hour Analysis"
        timeRange="24 hours"
        isLoading={isLoading}
      />
    </div>
  );
};

export { TemperaturePanel };