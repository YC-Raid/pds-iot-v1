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
  const { 
    sensorReadings, 
    dashboardData, 
    isLoading, 
    getSensorReadingsByTimeRange,
    getAggregatedSensorData 
  } = useSensorData();
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [timeRange, setTimeRange] = useState('24');
  const navigate = useNavigate();

  useEffect(() => {
    const loadTimeSeriesData = async () => {
      const hours = parseInt(timeRange);
      let finalData: any[] = [];

      if (hours <= 24) {
        // Use raw data for 1h/24h views
        const data = await getSensorReadingsByTimeRange(hours);
        const maxPoints = hours === 1 ? 60 : 200; // Show more points for 1 hour view
        
        const mapped = data.map((reading: any) => {
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
            temperature: reading.temperature ?? 0,
            humidity: reading.humidity ?? 0,
            pressure: reading.pressure ?? 0,
            pm25: reading.pm2_5 ?? 0,
            accel_magnitude: reading.accel_magnitude ?? 0,
            gyro_magnitude: reading.gyro_magnitude ?? 0,
            _ts: date.getTime(),
          };
        });

        const step = Math.max(1, Math.ceil(mapped.length / maxPoints));
        finalData = mapped.filter((_, i) => i % step === 0 || i === mapped.length - 1);
      } else if (hours === 168) {
        // 1 week: Try aggregated data first, fallback to raw data
        let data = await getAggregatedSensorData('day', 7);
        
        if (data.length === 0) {
          // Fallback: use raw data and aggregate manually
          const rawData = await getSensorReadingsByTimeRange(168);
          const dailyGroups: Record<string, any[]> = {};
          
          rawData.forEach(reading => {
            const date = new Date(reading.recorded_at);
            const dateStr = date.toISOString().split('T')[0];
            if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
            dailyGroups[dateStr].push(reading);
          });
          
          data = Object.entries(dailyGroups).map(([dateStr, readings]) => ({
            time_bucket: dateStr + 'T00:00:00Z',
            aggregation_level: 'day',
            location: 'hangar_01',
            avg_temperature: readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / readings.length,
            avg_humidity: readings.reduce((sum, r) => sum + (r.humidity || 0), 0) / readings.length,
            avg_pressure: readings.reduce((sum, r) => sum + (r.pressure || 0), 0) / readings.length,
            avg_gas_resistance: readings.reduce((sum, r) => sum + (r.gas_resistance || 0), 0) / readings.length,
            avg_pm1_0: readings.reduce((sum, r) => sum + (r.pm1_0 || 0), 0) / readings.length,
            avg_pm2_5: readings.reduce((sum, r) => sum + (r.pm2_5 || 0), 0) / readings.length,
            avg_pm10: readings.reduce((sum, r) => sum + (r.pm10 || 0), 0) / readings.length,
            avg_accel_magnitude: readings.reduce((sum, r) => sum + (r.accel_magnitude || 0), 0) / readings.length,
            avg_gyro_magnitude: readings.reduce((sum, r) => sum + (r.gyro_magnitude || 0), 0) / readings.length,
            min_temperature: Math.min(...readings.map(r => r.temperature || 0)),
            max_temperature: Math.max(...readings.map(r => r.temperature || 0)),
            data_points_count: readings.length,
            id: '',
            created_at: null
          }));
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
        finalData = allDates.map(dateStr => {
          const existing = dataMap[dateStr];
          const date = new Date(dateStr + 'T00:00:00');
          const label = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            timeZone: 'Asia/Singapore'
          });
          
          return {
            time: label,
            temperature: existing?.avg_temperature ?? 0,
            humidity: existing?.avg_humidity ?? 0,
            pressure: existing?.avg_pressure ?? 0,
            pm25: existing?.avg_pm2_5 ?? 0,
            accel_magnitude: existing?.avg_accel_magnitude ?? 0,
            gyro_magnitude: existing?.avg_gyro_magnitude ?? 0,
          };
        });
      } else if (hours === 720) {
        // 1 month: Try aggregated data first, fallback to raw data
        let data = await getAggregatedSensorData('day', 30);
        
        if (data.length === 0) {
          // Fallback: use raw data and aggregate manually
          const rawData = await getSensorReadingsByTimeRange(720);
          const dailyGroups: Record<string, any[]> = {};
          
          rawData.forEach(reading => {
            const date = new Date(reading.recorded_at);
            const dateStr = date.toISOString().split('T')[0];
            if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
            dailyGroups[dateStr].push(reading);
          });
          
          data = Object.entries(dailyGroups).map(([dateStr, readings]) => ({
            time_bucket: dateStr + 'T00:00:00Z',
            aggregation_level: 'day',
            location: 'hangar_01',
            avg_temperature: readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / readings.length,
            avg_humidity: readings.reduce((sum, r) => sum + (r.humidity || 0), 0) / readings.length,
            avg_pressure: readings.reduce((sum, r) => sum + (r.pressure || 0), 0) / readings.length,
            avg_gas_resistance: readings.reduce((sum, r) => sum + (r.gas_resistance || 0), 0) / readings.length,
            avg_pm1_0: readings.reduce((sum, r) => sum + (r.pm1_0 || 0), 0) / readings.length,
            avg_pm2_5: readings.reduce((sum, r) => sum + (r.pm2_5 || 0), 0) / readings.length,
            avg_pm10: readings.reduce((sum, r) => sum + (r.pm10 || 0), 0) / readings.length,
            avg_accel_magnitude: readings.reduce((sum, r) => sum + (r.accel_magnitude || 0), 0) / readings.length,
            avg_gyro_magnitude: readings.reduce((sum, r) => sum + (r.gyro_magnitude || 0), 0) / readings.length,
            min_temperature: Math.min(...readings.map(r => r.temperature || 0)),
            max_temperature: Math.max(...readings.map(r => r.temperature || 0)),
            data_points_count: readings.length,
            id: '',
            created_at: null
          }));
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
        finalData = Object.entries(weeklyData).map(([weekLabel, weekData]) => {
          if (weekData.length > 0) {
            return {
              time: weekLabel,
              temperature: weekData.reduce((sum, d) => sum + (d.avg_temperature || 0), 0) / weekData.length,
              humidity: weekData.reduce((sum, d) => sum + (d.avg_humidity || 0), 0) / weekData.length,
              pressure: weekData.reduce((sum, d) => sum + (d.avg_pressure || 0), 0) / weekData.length,
              pm25: weekData.reduce((sum, d) => sum + (d.avg_pm2_5 || 0), 0) / weekData.length,
              accel_magnitude: weekData.reduce((sum, d) => sum + (d.avg_accel_magnitude || 0), 0) / weekData.length,
              gyro_magnitude: weekData.reduce((sum, d) => sum + (d.avg_gyro_magnitude || 0), 0) / weekData.length,
            };
          } else {
            return {
              time: weekLabel,
              temperature: 0,
              humidity: 0,
              pressure: 0,
              pm25: 0,
              accel_magnitude: 0,
              gyro_magnitude: 0,
            };
          }
        });
      }

      setTimeSeriesData(finalData);
    };

    if (!isLoading) {
      loadTimeSeriesData();
    }
  }, [getSensorReadingsByTimeRange, getAggregatedSensorData, isLoading, timeRange]);

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
      value: latestReading.pm10 !== null ? latestReading.pm10 : "0",
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        <CardContent className="p-2 sm:p-6">
          <div className="w-full overflow-hidden">
            <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={timeSeriesData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--chart-2))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--chart-3))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pm25" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--chart-4))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export { SensorOverview };