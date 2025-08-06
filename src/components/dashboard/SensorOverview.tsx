
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge,
  Cpu,
  Wifi,
  Battery,
  AlertCircle
} from "lucide-react";

const SensorOverview = () => {
  // Mock sensor data - replace with real data
  const sensors = [
    {
      id: "temp_01",
      name: "Temperature Sensor #1",
      type: "Temperature",
      location: "North Wall",
      value: 22.5,
      unit: "°C",
      status: "online",
      lastUpdate: "30s ago",
      icon: Thermometer,
      battery: 85
    },
    {
      id: "hum_01",
      name: "Humidity Sensor #1",
      type: "Humidity",
      location: "Center",
      value: 65,
      unit: "%",
      status: "online",
      lastUpdate: "45s ago",
      icon: Droplets,
      battery: 72
    },
    {
      id: "air_01",
      name: "Air Quality Monitor",
      type: "Air Quality",
      location: "Entrance",
      value: 85,
      unit: "AQI",
      status: "warning",
      lastUpdate: "1m ago",
      icon: Wind,
      battery: 91
    },
    {
      id: "press_01",
      name: "Pressure Sensor",
      type: "Pressure",
      location: "South Wall",
      value: 1013.2,
      unit: "hPa",
      status: "online",
      lastUpdate: "15s ago",
      icon: Gauge,
      battery: 88
    }
  ];

  // Mock time series data
  const timeSeriesData = [
    { time: "00:00", temperature: 21.2, humidity: 68, airQuality: 82 },
    { time: "04:00", temperature: 20.8, humidity: 70, airQuality: 85 },
    { time: "08:00", temperature: 22.1, humidity: 65, airQuality: 88 },
    { time: "12:00", temperature: 24.5, humidity: 62, airQuality: 91 },
    { time: "16:00", temperature: 23.8, humidity: 64, airQuality: 87 },
    { time: "20:00", temperature: 22.5, humidity: 66, airQuality: 85 },
  ];

  const chartConfig = {
    temperature: {
      label: "Temperature (°C)",
      color: "hsl(var(--chart-1))",
    },
    humidity: {
      label: "Humidity (%)",
      color: "hsl(var(--chart-2))",
    },
    airQuality: {
      label: "Air Quality (AQI)",
      color: "hsl(var(--chart-3))",
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

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return "text-success";
    if (battery > 20) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Real-time Sensor Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sensors.map((sensor) => {
          const IconComponent = sensor.icon;
          return (
            <Card key={sensor.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{sensor.type}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sensor.value} {sensor.unit}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {sensor.location} • {sensor.lastUpdate}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(sensor.status)}>
                    {sensor.status === "online" && <Wifi className="h-3 w-3 mr-1" />}
                    {sensor.status === "warning" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {sensor.status}
                  </Badge>
                  <div className={`flex items-center gap-1 text-xs ${getBatteryColor(sensor.battery)}`}>
                    <Battery className="h-3 w-3" />
                    {sensor.battery}%
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Sensor Trends</CardTitle>
          <CardDescription>
            Real-time environmental monitoring over the last 24 hours
          </CardDescription>
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
                  dataKey="airQuality" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-3))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sensor Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Sensor Network Status
          </CardTitle>
          <CardDescription>Detailed status of all connected sensors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <sensor.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{sensor.name}</p>
                    <p className="text-sm text-muted-foreground">{sensor.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{sensor.value} {sensor.unit}</p>
                    <p className="text-xs text-muted-foreground">{sensor.lastUpdate}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(sensor.status)}>
                    {sensor.status}
                  </Badge>
                  <div className={`flex items-center gap-1 text-sm ${getBatteryColor(sensor.battery)}`}>
                    <Battery className="h-4 w-4" />
                    {sensor.battery}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SensorOverview };
