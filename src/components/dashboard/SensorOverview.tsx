import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge,
  Cpu,
  Wifi,
  AlertCircle,
  Zap,
  Activity,
  Eye,
  Cloud,
  Waves
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SensorOverview = () => {
  const { sensorReadings, dashboardData, isLoading, getSensorReadingsByTimeRange } = useSensorData();
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [timeRange, setTimeRange] = useState('24');
  const navigate = useNavigate();

  useEffect(() => {
    const loadTimeSeriesData = async () => {
      const hours = parseInt(timeRange);
      const data = await getSensorReadingsByTimeRange(hours);
      
      // Determine sampling based on time range to avoid overwhelming data
      let sampleSize;
      if (hours <= 1) sampleSize = -30; // Last 30 readings for 1 hour
      else if (hours <= 24) sampleSize = -50; // Last 50 readings for 24 hours  
      else if (hours <= 168) sampleSize = -100; // Last 100 readings for 1 week
      else sampleSize = -200; // Last 200 readings for longer periods
      
      const formattedData = data.map((reading, index) => {
        const date = new Date(reading.recorded_at);
        let timeLabel;
        
        // Format time/date based on time range
        if (hours <= 24) {
          // For 1 hour and 24 hours: show time only
          timeLabel = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        } else {
          // For 1 week and 1 month: show date and time
          timeLabel = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
        
        return {
          time: timeLabel,
          temperature: reading.temperature || 0,
          humidity: reading.humidity || 0,
          pressure: reading.pressure || 0,
          pm25: reading.pm2_5 || 0,
          accel_magnitude: reading.accel_magnitude || 0,
          gyro_magnitude: reading.gyro_magnitude || 0
        };
      }).slice(sampleSize); // Sample data based on time range
      setTimeSeriesData(formattedData);
    };

    if (!isLoading) {
      loadTimeSeriesData();
    }
  }, [getSensorReadingsByTimeRange, isLoading, timeRange]);

  // Get latest sensor readings
  const latestReading = sensorReadings[0];
  
  // Create sensor cards from real data - Rearranged for better visual organization
  const sensors = latestReading ? [
    // First row: Environmental basics
    {
      id: "temp_01",
      name: "Temperature Sensor",
      type: "Temperature",
      location: latestReading.location || "Hangar 01",
      value: latestReading.temperature?.toFixed(1) || "N/A",
      unit: "°C",
      status: latestReading.temperature ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Thermometer
    },
    {
      id: "hum_01",
      name: "Humidity Sensor",
      type: "Humidity",
      location: latestReading.location || "Hangar 01",
      value: latestReading.humidity?.toFixed(1) || "N/A",
      unit: "%",
      status: latestReading.humidity ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Droplets
    },
    {
      id: "press_01",
      name: "Pressure Sensor",
      type: "Pressure",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pressure?.toFixed(1) || "N/A",
      unit: "hPa",
      status: latestReading.pressure ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Gauge
    },
    // Second row: Gas Quality, Acceleration, Rotation
    {
      id: "gas_01",
      name: "Gas Resistance",
      type: "Gas Quality",
      location: latestReading.location || "Hangar 01",
      value: latestReading.gas_resistance?.toFixed(0) || "N/A",
      unit: "Ω",
      status: latestReading.gas_resistance ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Zap
    },
    {
      id: "accel_01",
      name: "Accelerometer",
      type: "Acceleration",
      location: latestReading.location || "Hangar 01",
      value: `X: ${latestReading.accel_x?.toFixed(3) || "N/A"} | Y: ${latestReading.accel_y?.toFixed(3) || "N/A"} | Z: ${latestReading.accel_z?.toFixed(3) || "N/A"}`,
      magnitude: latestReading.accel_magnitude?.toFixed(3) || "N/A",
      unit: "m/s²",
      status: latestReading.accel_magnitude !== null ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Activity
    },
    {
      id: "gyro_01",
      name: "Gyroscope",
      type: "Rotation",
      location: latestReading.location || "Hangar 01",
      value: `X: ${latestReading.gyro_x?.toFixed(3) || "N/A"} | Y: ${latestReading.gyro_y?.toFixed(3) || "N/A"} | Z: ${latestReading.gyro_z?.toFixed(3) || "N/A"}`,
      magnitude: latestReading.gyro_magnitude?.toFixed(3) || "N/A",
      unit: "°/s",
      status: latestReading.gyro_magnitude !== null ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Waves
    },
    // Third row: Particulate Matter monitors
    {
      id: "pm1_01",
      name: "PM1.0 Monitor",
      type: "PM1.0",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pm1_0 || "N/A",
      unit: "μg/m³",
      status: latestReading.pm1_0 !== null ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Eye
    },
    {
      id: "pm25_01",
      name: "PM2.5 Monitor",
      type: "PM2.5",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pm2_5 || "N/A",
      unit: "μg/m³",
      status: latestReading.pm2_5 !== null ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Cloud
    },
    {
      id: "pm10_01",
      name: "PM10 Monitor",
      type: "PM10",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pm10 !== null ? latestReading.pm10 : "N/A",
      unit: "μg/m³",
      status: latestReading.pm10 !== null ? "online" : "offline",
      lastUpdate: new Date(latestReading.recorded_at).toLocaleString(),
      icon: Wind
    }
  ] : [];

  const chartConfig = {
    temperature: {
      label: "Temperature (°C)",
      color: "hsl(var(--chart-1))",
    },
    humidity: {
      label: "Humidity (%)",
      color: "hsl(var(--chart-2))",
    },
    pressure: {
      label: "Pressure (hPa)",
      color: "hsl(var(--chart-3))",
    },
    pm25: {
      label: "PM2.5 (μg/m³)",
      color: "hsl(var(--chart-4))",
    },
    accel_magnitude: {
      label: "Acceleration (m/s²)",
      color: "hsl(var(--chart-5))",
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success/10 text-success border-success/20";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "offline":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Last Data Update Card */}
      {!isLoading && latestReading && (
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Data Update</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {new Date(latestReading.recorded_at).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Data from {latestReading.location || "Hangar 01"} • {sensorReadings.length} total readings
            </p>
            <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Real-time Sensor Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sensors.map((sensor) => {
          const IconComponent = sensor.icon;
          return (
            <Card 
              key={sensor.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                const sensorTypeMap = {
                  "Temperature": "temperature",
                  "Humidity": "humidity", 
                  "Pressure": "pressure",
                  "Gas Quality": "gas",
                  "PM1.0": "pm1",
                  "PM2.5": "pm25", 
                  "PM10": "pm10",
                  "Acceleration": "acceleration",
                  "Rotation": "rotation"
                };
                const sensorPath = sensorTypeMap[sensor.type] || "temperature";
                navigate(`/sensor/${sensorPath}`);
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{sensor.type}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {sensor.type === "Acceleration" || sensor.type === "Rotation" ? (
                  <>
                    <div className="text-sm font-medium mb-1">
                      Magnitude: {sensor.magnitude} {sensor.unit}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {sensor.value}
                    </div>
                  </>
                ) : (
                  <div className="text-2xl font-bold mb-2">
                    {sensor.value} {sensor.unit}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mb-2">
                  {sensor.location} • Click to view details
                </p>
                <div className="flex items-center">
                  <Badge variant="outline" className={getStatusColor(sensor.status)}>
                    {sensor.status === "online" && <Wifi className="h-3 w-3 mr-1" />}
                    {sensor.status === "warning" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {sensor.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sensor Trends - Last {timeRange === '1' ? '1 Hour' : timeRange === '24' ? '24 Hours' : timeRange === '168' ? '1 Week' : '1 Month'}</CardTitle>
              <CardDescription>
                Real-time data from your AWS RDS sensor network ({timeSeriesData.length} readings)
              </CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
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
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-2))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-3))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pm25" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-4))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
};

export { SensorOverview };