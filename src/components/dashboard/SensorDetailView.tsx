import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ArrowLeft, Activity } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState } from "react";

interface SensorDetailViewProps {
  sensor: {
    id: string;
    name: string;
    type: string;
    location: string;
    icon: any;
  };
  onBack: () => void;
}

export const SensorDetailView = ({ sensor, onBack }: SensorDetailViewProps) => {
  console.log(`🚀 SensorDetailView loaded for sensor:`, sensor);
  const { getSensorReadingsByTimeRange } = useSensorData();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetailedData = async () => {
      console.log(`🔍 Loading data for sensor: ${sensor.type}`);
      setIsLoading(true);
      try {
        const data = await getSensorReadingsByTimeRange(24);
        console.log(`📊 Raw fetched data count: ${data.length}`);
        
        if (!data || data.length === 0) {
          console.warn(`⚠️ No data available for ${sensor.type}`);
          setChartData([]);
          setIsLoading(false);
          return;
        }
        
        console.log('📋 Sample raw data:', data.slice(0, 3));
        console.log('📋 Sample recorded_at:', data.slice(0, 3).map(d => d.recorded_at));
        
        let formattedData = [];
        
        // Process data based on sensor type - recorded_at is already Singapore time
        if (sensor.type === "Acceleration") {
          formattedData = data.map((reading) => {
            const date = new Date(reading.recorded_at);
            const timeStr = date.getHours().toString().padStart(2, '0') + ':' + 
                           date.getMinutes().toString().padStart(2, '0');
            return {
              time: timeStr,
              x_axis: Number(reading.accel_x) || 0,
              y_axis: Number(reading.accel_y) || 0,
              z_axis: Number(reading.accel_z) || 0,
              magnitude: Number(reading.accel_magnitude) || 0
            };
          }).slice(-50);
        } else if (sensor.type === "Rotation") {
          formattedData = data.map((reading) => {
            const date = new Date(reading.recorded_at);
            const timeStr = date.getHours().toString().padStart(2, '0') + ':' + 
                           date.getMinutes().toString().padStart(2, '0');
            return {
              time: timeStr,
              x_axis: Number(reading.gyro_x) || 0,
              y_axis: Number(reading.gyro_y) || 0,
              z_axis: Number(reading.gyro_z) || 0,
              magnitude: Number(reading.gyro_magnitude) || 0
            };
          }).slice(-50);
        } else {
          // Single value sensors
          const valueKey = {
            "Temperature": "temperature",
            "Humidity": "humidity", 
            "Pressure": "pressure",
            "Gas Quality": "gas_resistance",
            "PM1.0": "pm1_0",
            "PM2.5": "pm2_5",
            "PM10": "pm10"
          }[sensor.type];
          
          formattedData = data.map((reading) => {
            const date = new Date(reading.recorded_at);
            const timeStr = date.getHours().toString().padStart(2, '0') + ':' + 
                           date.getMinutes().toString().padStart(2, '0');
            return {
              time: timeStr,
              value: Number(reading[valueKey]) || 0
            };
          }).slice(-50);
        }
        
        console.log(`✅ Formatted ${formattedData.length} data points for ${sensor.type}`);
        setChartData(formattedData);
      } catch (error) {
        console.error('❌ Failed to load sensor data:', error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetailedData();
  }, [sensor.type, getSensorReadingsByTimeRange]);

  const getUnit = () => {
    const units = {
      "Temperature": "°C",
      "Humidity": "%",
      "Pressure": "hPa", 
      "Gas Quality": "Ω",
      "PM1.0": "μg/m³",
      "PM2.5": "μg/m³",
      "PM10": "μg/m³",
      "Acceleration": "m/s²",
      "Rotation": "°/s"
    };
    return units[sensor.type] || "";
  };

  const chartConfig = {
    x_axis: { label: "X-Axis", color: "hsl(var(--chart-1))" },
    y_axis: { label: "Y-Axis", color: "hsl(var(--chart-2))" },
    z_axis: { label: "Z-Axis", color: "hsl(var(--chart-3))" },
    magnitude: { label: "Magnitude", color: "hsl(var(--chart-4))" },
    value: { label: `${sensor.type} (${getUnit()})`, color: "hsl(var(--chart-1))" }
  };

  const IconComponent = sensor.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <IconComponent className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{sensor.name}</CardTitle>
                <CardDescription>{sensor.location} • Last 24 Hours Analysis</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{sensor.type} Data Trend</CardTitle>
          <CardDescription>Historical readings for {sensor.type.toLowerCase()} sensor</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sensor data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No data available for this sensor</p>
                <p className="text-sm text-muted-foreground mt-2">Data may still be syncing from AWS RDS</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  
                  {(sensor.type === "Acceleration" || sensor.type === "Rotation") ? (
                    <>
                      <Line type="monotone" dataKey="x_axis" stroke="hsl(var(--chart-1))" strokeWidth={2} name="X-Axis" />
                      <Line type="monotone" dataKey="y_axis" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Y-Axis" />
                      <Line type="monotone" dataKey="z_axis" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Z-Axis" />
                      <Line type="monotone" dataKey="magnitude" stroke="hsl(var(--chart-4))" strokeWidth={3} strokeDasharray="5 5" name="Magnitude" />
                    </>
                  ) : (
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};