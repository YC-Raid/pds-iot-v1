import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ArrowLeft, Activity, Waves } from "lucide-react";
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
  const { getSensorReadingsByTimeRange } = useSensorData();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetailedData = async () => {
      setIsLoading(true);
      try {
        console.log(`Loading data for sensor: ${sensor.type}`);
        const data = await getSensorReadingsByTimeRange(24);
        console.log(`Raw fetched data count: ${data.length}`);
        
        if (!data || data.length === 0) {
          console.warn(`No data available for ${sensor.type}`);
          setChartData([]);
          return;
        }
        
        // Log first few records to debug data structure
        console.log('Sample raw data:', data.slice(0, 3));
        
        let formattedData = [];
        
        if (sensor.type === "Acceleration") {
          formattedData = data
            .map((reading, index) => {
              const x_axis = reading.accel_x;
              const y_axis = reading.accel_y; 
              const z_axis = reading.accel_z;
              const magnitude = reading.accel_magnitude;
              
              console.log(`Acceleration data ${index}:`, { x_axis, y_axis, z_axis, magnitude });
              
              return {
                time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                timestamp: reading.recorded_at,
                x_axis: x_axis || 0,
                y_axis: y_axis || 0,
                z_axis: z_axis || 0,
                magnitude: magnitude || 0
              };
            })
            .slice(-100);
        } else if (sensor.type === "Rotation") {
          formattedData = data
            .map((reading, index) => {
              const x_axis = reading.gyro_x;
              const y_axis = reading.gyro_y;
              const z_axis = reading.gyro_z;
              const magnitude = reading.gyro_magnitude;
              
              console.log(`Rotation data ${index}:`, { x_axis, y_axis, z_axis, magnitude });
              
              return {
                time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                timestamp: reading.recorded_at,
                x_axis: x_axis || 0,
                y_axis: y_axis || 0,
                z_axis: z_axis || 0,
                magnitude: magnitude || 0
              };
            })
            .slice(-100);
        } else {
          // For other sensors, show single value trend
          formattedData = data
            .map((reading, index) => {
              const value = getValueBySensorType(reading, sensor.type);
              console.log(`${sensor.type} data ${index}:`, { value, reading: reading });
              
              return {
                time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                timestamp: reading.recorded_at,
                value: value !== null && value !== undefined ? value : 0
              };
            })
            .slice(-100);
        }
        
        console.log(`Final formatted data for ${sensor.type}:`, {
          count: formattedData.length,
          sample: formattedData.slice(0, 3),
          last: formattedData.slice(-3)
        });
        
        setChartData(formattedData);
      } catch (error) {
        console.error('Failed to load detailed sensor data:', error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetailedData();
  }, [sensor, getSensorReadingsByTimeRange]);

  const getValueBySensorType = (reading: any, sensorType: string) => {
    switch (sensorType) {
      case "Temperature":
        return reading.temperature || 0;
      case "Humidity":
        return reading.humidity || 0;
      case "Pressure":
        return reading.pressure || 0;
      case "Gas Quality":
        return reading.gas_resistance || 0;
      case "PM1.0":
        return reading.pm1_0 || 0;
      case "PM2.5":
        return reading.pm2_5 || 0;
      case "PM10":
        return reading.pm10 || 0;
      default:
        return 0;
    }
  };

  const getUnit = () => {
    switch (sensor.type) {
      case "Temperature":
        return "°C";
      case "Humidity":
        return "%";
      case "Pressure":
        return "hPa";
      case "Gas Quality":
        return "Ω";
      case "PM1.0":
      case "PM2.5":
      case "PM10":
        return "μg/m³";
      case "Acceleration":
        return "m/s²";
      case "Rotation":
        return "°/s";
      default:
        return "";
    }
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
          <CardTitle>
            {sensor.type === "Acceleration" || sensor.type === "Rotation" 
              ? `${sensor.type} Data - All Axes` 
              : `${sensor.type} Trend`
            }
          </CardTitle>
          <CardDescription>
            {sensor.type === "Acceleration" || sensor.type === "Rotation"
              ? `Individual X, Y, Z axis readings and magnitude for ${sensor.type.toLowerCase()}`
              : `Historical readings for ${sensor.type.toLowerCase()} sensor`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading sensor data...</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  
                  {(sensor.type === "Acceleration" || sensor.type === "Rotation") ? (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="x_axis" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        name="X-Axis"
                        dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y_axis" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        name="Y-Axis"
                        dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="z_axis" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        name="Z-Axis"
                        dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="magnitude" 
                        stroke="hsl(var(--chart-4))" 
                        strokeWidth={3}
                        name="Magnitude"
                        strokeDasharray="5 5"
                        dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 4 }}
                      />
                    </>
                  ) : (
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, stroke: "hsl(var(--background))", r: 4 }}
                      activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Statistical Summary */}
      {(sensor.type === "Acceleration" || sensor.type === "Rotation") && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">X-Axis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">
                {chartData.length > 0 ? chartData[chartData.length - 1]?.x_axis?.toFixed(3) : "0.000"}
              </div>
              <p className="text-xs text-muted-foreground">{getUnit()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Y-Axis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">
                {chartData.length > 0 ? chartData[chartData.length - 1]?.y_axis?.toFixed(3) : "0.000"}
              </div>
              <p className="text-xs text-muted-foreground">{getUnit()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Z-Axis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">
                {chartData.length > 0 ? chartData[chartData.length - 1]?.z_axis?.toFixed(3) : "0.000"}
              </div>
              <p className="text-xs text-muted-foreground">{getUnit()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Magnitude</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                {chartData.length > 0 ? chartData[chartData.length - 1]?.magnitude?.toFixed(3) : "0.000"}
              </div>
              <p className="text-xs text-muted-foreground">{getUnit()}</p>
              <Badge variant="outline" className="mt-1">
                Current
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};