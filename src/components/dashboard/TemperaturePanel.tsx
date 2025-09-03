import { useEffect, useState } from "react";
import { Thermometer } from "lucide-react";
import { EnhancedSensorChart, SensorConfig, DataPoint } from "./EnhancedSensorChart";
import { useSensorData } from "@/hooks/useSensorData";

const TemperaturePanel = () => {
  const { getSensorReadingsByTimeRange, isLoading } = useSensorData();
  const [temperatureData, setTemperatureData] = useState<DataPoint[]>([]);

  // Temperature sensor configuration with thresholds and optimal ranges
  const temperatureConfig: SensorConfig = {
    name: "Temperature",
    unit: "°C", 
    icon: Thermometer,
    description: "Environmental temperature monitoring for optimal storage conditions",
    optimalRange: { min: 18, max: 25 }, // Optimal storage temperature range
    thresholds: [
      {
        value: 15,
        label: "Low Critical",
        color: "#3b82f6", // Blue for cold
        type: 'critical'
      },
      {
        value: 16,
        label: "Low Warning", 
        color: "#06b6d4", // Light blue
        type: 'warning'
      },
      {
        value: 28,
        label: "High Warning",
        color: "#f59e0b", // Orange
        type: 'warning'
      },
      {
        value: 30,
        label: "High Critical",
        color: "#ef4444", // Red for hot
        type: 'critical'
      }
    ]
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
      
      {/* Additional Temperature-Specific Insights */}
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
    </div>
  );
};

export { TemperaturePanel };