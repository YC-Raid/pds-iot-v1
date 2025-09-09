import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Waves,
  ChevronDown
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
  const [selectedSensors, setSelectedSensors] = useState(['temperature', 'humidity', 'pressure', 'pm25']);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTimeSeriesData = async () => {
      const hours = parseInt(timeRange);
      let finalData: any[] = [];

      if (hours <= 24) {
        // Use raw data for 1h/24h views
        const data = await getSensorReadingsByTimeRange(hours);
        
        if (hours === 1) {
          // 1 hour: Group by minute and average
          const minuteGroups = new Map();
          
          data.forEach((reading: any) => {
            // processed_sensor_readings.recorded_at is already in Singapore time
            const singaporeDate = new Date(reading.recorded_at);
            const singaporeTime = `${singaporeDate.getHours().toString().padStart(2, '0')}:${singaporeDate.getMinutes().toString().padStart(2, '0')}`;
            
            if (!minuteGroups.has(singaporeTime)) {
              minuteGroups.set(singaporeTime, {
                temperature: [], humidity: [], pressure: [], pm25: [], pm1: [], pm10: [], gas_resistance: [],
                accel_magnitude: [], gyro_magnitude: [], timestamp: reading.recorded_at
              });
            }
            
            const group = minuteGroups.get(singaporeTime);
            group.temperature.push(reading.temperature ?? 0);
            group.humidity.push(reading.humidity ?? 0);
            group.pressure.push(reading.pressure ?? 0);
            group.pm25.push(reading.pm2_5 ?? 0);
            group.pm1.push(reading.pm1_0 ?? 0);
            group.pm10.push(reading.pm10 ?? 0);
            group.gas_resistance.push(reading.gas_resistance ?? 0);
            group.accel_magnitude.push(reading.accel_magnitude ?? 0);
            group.gyro_magnitude.push(reading.gyro_magnitude ?? 0);
          });
          
          finalData = Array.from(minuteGroups.entries()).map(([timeLabel, group]) => ({
            time: timeLabel,
            temperature: group.temperature.reduce((sum, val) => sum + val, 0) / group.temperature.length,
            humidity: group.humidity.reduce((sum, val) => sum + val, 0) / group.humidity.length,
            pressure: group.pressure.reduce((sum, val) => sum + val, 0) / group.pressure.length,
            pm25: group.pm25.reduce((sum, val) => sum + val, 0) / group.pm25.length,
            pm1: group.pm1.reduce((sum, val) => sum + val, 0) / group.pm1.length,
            pm10: group.pm10.reduce((sum, val) => sum + val, 0) / group.pm10.length,
            gas_resistance: group.gas_resistance.reduce((sum, val) => sum + val, 0) / group.gas_resistance.length,
            accel_magnitude: group.accel_magnitude.reduce((sum, val) => sum + val, 0) / group.accel_magnitude.length,
            gyro_magnitude: group.gyro_magnitude.reduce((sum, val) => sum + val, 0) / group.gyro_magnitude.length,
            _ts: new Date(group.timestamp).getTime(),
          })).sort((a, b) => a.time.localeCompare(b.time));
          
        } else if (hours === 24) {
          // 24 hours: Group by hour and average - same pattern as 1h but grouped by hour
          const hourGroups = new Map();
          
          data.forEach((reading: any) => {
            // processed_sensor_readings.recorded_at is already in Singapore time
            const singaporeDate = new Date(reading.recorded_at);
            const singaporeHour = `${singaporeDate.getHours().toString().padStart(2, '0')}:00`;
            
            if (!hourGroups.has(singaporeHour)) {
              hourGroups.set(singaporeHour, {
                temperature: [], humidity: [], pressure: [], pm25: [], pm1: [], pm10: [], gas_resistance: [],
                accel_magnitude: [], gyro_magnitude: [], timestamp: reading.recorded_at
              });
            }
            
            const group = hourGroups.get(singaporeHour);
            group.temperature.push(reading.temperature ?? 0);
            group.humidity.push(reading.humidity ?? 0);
            group.pressure.push(reading.pressure ?? 0);
            group.pm25.push(reading.pm2_5 ?? 0);
            group.pm1.push(reading.pm1_0 ?? 0);
            group.pm10.push(reading.pm10 ?? 0);
            group.gas_resistance.push(reading.gas_resistance ?? 0);
            group.accel_magnitude.push(reading.accel_magnitude ?? 0);
            group.gyro_magnitude.push(reading.gyro_magnitude ?? 0);
          });
          
          // Convert hour groups to chart data - same pattern as 1h
          finalData = Array.from(hourGroups.entries()).map(([timeLabel, group]) => ({
            time: timeLabel,
            temperature: group.temperature.reduce((sum, val) => sum + val, 0) / group.temperature.length,
            humidity: group.humidity.reduce((sum, val) => sum + val, 0) / group.humidity.length,
            pressure: group.pressure.reduce((sum, val) => sum + val, 0) / group.pressure.length,
            pm25: group.pm25.reduce((sum, val) => sum + val, 0) / group.pm25.length,
            pm1: group.pm1.reduce((sum, val) => sum + val, 0) / group.pm1.length,
            pm10: group.pm10.reduce((sum, val) => sum + val, 0) / group.pm10.length,
            gas_resistance: group.gas_resistance.reduce((sum, val) => sum + val, 0) / group.gas_resistance.length,
            accel_magnitude: group.accel_magnitude.reduce((sum, val) => sum + val, 0) / group.accel_magnitude.length,
            gyro_magnitude: group.gyro_magnitude.reduce((sum, val) => sum + val, 0) / group.gyro_magnitude.length,
            _ts: new Date(group.timestamp).getTime(),
          })).sort((a, b) => a.time.localeCompare(b.time));
        }
      } else if (hours === 168) {
        // 1 week: Group by day using raw data - same simple pattern as 1h and 24h
        const data = await getSensorReadingsByTimeRange(168);
        const dayGroups = new Map();
        
        data.forEach((reading: any) => {
          const singaporeDate = new Date(reading.recorded_at);
          const singaporeDay = singaporeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          if (!dayGroups.has(singaporeDay)) {
            dayGroups.set(singaporeDay, {
              temperature: [], humidity: [], pressure: [], pm25: [], pm1: [], pm10: [], gas_resistance: [],
              accel_magnitude: [], gyro_magnitude: [], timestamp: reading.recorded_at
            });
          }
          
          const group = dayGroups.get(singaporeDay);
          group.temperature.push(reading.temperature ?? 0);
          group.humidity.push(reading.humidity ?? 0);
          group.pressure.push(reading.pressure ?? 0);
          group.pm25.push(reading.pm2_5 ?? 0);
          group.pm1.push(reading.pm1_0 ?? 0);
          group.pm10.push(reading.pm10 ?? 0);
          group.gas_resistance.push(reading.gas_resistance ?? 0);
          group.accel_magnitude.push(reading.accel_magnitude ?? 0);
          group.gyro_magnitude.push(reading.gyro_magnitude ?? 0);
        });
        
        finalData = Array.from(dayGroups.entries()).map(([timeLabel, group]) => ({
          time: timeLabel,
          temperature: group.temperature.length > 0 ? group.temperature.reduce((sum, val) => sum + val, 0) / group.temperature.length : 0,
          humidity: group.humidity.length > 0 ? group.humidity.reduce((sum, val) => sum + val, 0) / group.humidity.length : 0,
          pressure: group.pressure.length > 0 ? group.pressure.reduce((sum, val) => sum + val, 0) / group.pressure.length : 0,
          pm25: group.pm25.length > 0 ? group.pm25.reduce((sum, val) => sum + val, 0) / group.pm25.length : 0,
          pm1: group.pm1.length > 0 ? group.pm1.reduce((sum, val) => sum + val, 0) / group.pm1.length : 0,
          pm10: group.pm10.length > 0 ? group.pm10.reduce((sum, val) => sum + val, 0) / group.pm10.length : 0,
          gas_resistance: group.gas_resistance.length > 0 ? group.gas_resistance.reduce((sum, val) => sum + val, 0) / group.gas_resistance.length : 0,
          accel_magnitude: group.accel_magnitude.length > 0 ? group.accel_magnitude.reduce((sum, val) => sum + val, 0) / group.accel_magnitude.length : 0,
          gyro_magnitude: group.gyro_magnitude.length > 0 ? group.gyro_magnitude.reduce((sum, val) => sum + val, 0) / group.gyro_magnitude.length : 0,
          _ts: new Date(group.timestamp).getTime(),
        })).sort((a, b) => new Date(a.time + ', 2024').getTime() - new Date(b.time + ', 2024').getTime());
        
      } else if (hours === 720) {
        // 1 month: Group by day using raw data - same simple pattern as 1h, 24h, and 1 week
        const data = await getSensorReadingsByTimeRange(720);
        const dayGroups = new Map();
        
        data.forEach((reading: any) => {
          const singaporeDate = new Date(reading.recorded_at);
          const singaporeDay = singaporeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          if (!dayGroups.has(singaporeDay)) {
            dayGroups.set(singaporeDay, {
              temperature: [], humidity: [], pressure: [], pm25: [], pm1: [], pm10: [], gas_resistance: [],
              accel_magnitude: [], gyro_magnitude: [], timestamp: reading.recorded_at
            });
          }
          
          const group = dayGroups.get(singaporeDay);
          group.temperature.push(reading.temperature ?? 0);
          group.humidity.push(reading.humidity ?? 0);
          group.pressure.push(reading.pressure ?? 0);
          group.pm25.push(reading.pm2_5 ?? 0);
          group.pm1.push(reading.pm1_0 ?? 0);
          group.pm10.push(reading.pm10 ?? 0);
          group.gas_resistance.push(reading.gas_resistance ?? 0);
          group.accel_magnitude.push(reading.accel_magnitude ?? 0);
          group.gyro_magnitude.push(reading.gyro_magnitude ?? 0);
        });
        
        finalData = Array.from(dayGroups.entries()).map(([timeLabel, group]) => ({
          time: timeLabel,
          temperature: group.temperature.length > 0 ? group.temperature.reduce((sum, val) => sum + val, 0) / group.temperature.length : 0,
          humidity: group.humidity.length > 0 ? group.humidity.reduce((sum, val) => sum + val, 0) / group.humidity.length : 0,
          pressure: group.pressure.length > 0 ? group.pressure.reduce((sum, val) => sum + val, 0) / group.pressure.length : 0,
          pm25: group.pm25.length > 0 ? group.pm25.reduce((sum, val) => sum + val, 0) / group.pm25.length : 0,
          pm1: group.pm1.length > 0 ? group.pm1.reduce((sum, val) => sum + val, 0) / group.pm1.length : 0,
          pm10: group.pm10.length > 0 ? group.pm10.reduce((sum, val) => sum + val, 0) / group.pm10.length : 0,
          gas_resistance: group.gas_resistance.length > 0 ? group.gas_resistance.reduce((sum, val) => sum + val, 0) / group.gas_resistance.length : 0,
          accel_magnitude: group.accel_magnitude.length > 0 ? group.accel_magnitude.reduce((sum, val) => sum + val, 0) / group.accel_magnitude.length : 0,
          gyro_magnitude: group.gyro_magnitude.length > 0 ? group.gyro_magnitude.reduce((sum, val) => sum + val, 0) / group.gyro_magnitude.length : 0,
          _ts: new Date(group.timestamp).getTime(),
        })).sort((a, b) => new Date(a.time + ', 2024').getTime() - new Date(b.time + ', 2024').getTime());
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
      value: latestReading.temperature?.toFixed(2) || "N/A",
      unit: "°C",
      status: latestReading.temperature ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Thermometer
    },
    {
      id: "hum_01",
      name: "Humidity Sensor",
      type: "Humidity",
      location: latestReading.location || "Hangar 01",
      value: latestReading.humidity?.toFixed(2) || "N/A",
      unit: "%",
      status: latestReading.humidity ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Droplets
    },
    {
      id: "press_01",
      name: "Pressure Sensor",
      type: "Pressure",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pressure?.toFixed(2) || "N/A",
      unit: "hPa",
      status: latestReading.pressure ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
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
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Zap
    },
    {
      id: "accel_01",
      name: "Accelerometer",
      type: "Acceleration",
      location: latestReading.location || "Hangar 01",
      value: `X: ${latestReading.accel_x?.toFixed(2) || "N/A"} | Y: ${latestReading.accel_y?.toFixed(2) || "N/A"} | Z: ${latestReading.accel_z?.toFixed(2) || "N/A"}`,
      magnitude: latestReading.accel_magnitude?.toFixed(2) || "N/A",
      unit: "m/s²",
      status: latestReading.accel_magnitude !== null ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Activity
    },
    {
      id: "gyro_01",
      name: "Gyroscope",
      type: "Rotation",
      location: latestReading.location || "Hangar 01",
      value: `X: ${latestReading.gyro_x?.toFixed(2) || "N/A"} | Y: ${latestReading.gyro_y?.toFixed(2) || "N/A"} | Z: ${latestReading.gyro_z?.toFixed(2) || "N/A"}`,
      magnitude: latestReading.gyro_magnitude?.toFixed(2) || "N/A",
      unit: "°/s",
      status: latestReading.gyro_magnitude !== null ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Waves
    },
    // Third row: Particulate Matter monitors
    {
      id: "pm1_01",
      name: "PM1.0 Monitor",
      type: "PM1.0",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pm1_0?.toFixed(2) || "0.00",
      unit: "μg/m³",
      status: latestReading.pm1_0 !== null ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Eye
    },
    {
      id: "pm25_01",
      name: "PM2.5 Monitor",
      type: "PM2.5",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pm2_5?.toFixed(2) || "0.00",
      unit: "μg/m³",
      status: latestReading.pm2_5 !== null ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
      icon: Cloud
    },
    {
      id: "pm10_01",
      name: "PM10 Monitor",
      type: "PM10",
      location: latestReading.location || "Hangar 01",
      value: latestReading.pm10?.toFixed(2) || "0.00",
      unit: "μg/m³",
      status: latestReading.pm10 !== null ? "online" : "offline",
      lastUpdate: (() => {
        // processed_sensor_readings.recorded_at is already in Singapore time
        const singaporeDate = new Date(latestReading.recorded_at);
        return singaporeDate.toLocaleString();
      })(),
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
    pm1: {
      label: "PM1.0 (μg/m³)",
      color: "hsl(var(--chart-5))",
    },
    pm10: {
      label: "PM10 (μg/m³)",
      color: "hsl(var(--chart-6))",
    },
    gas_resistance: {
      label: "Gas Resistance (Ω)",
      color: "hsl(var(--chart-7))",
    },
    accel_magnitude: {
      label: "Acceleration (m/s²)",
      color: "hsl(var(--chart-8))",
    },
    gyro_magnitude: {
      label: "Gyroscope (°/s)",
      color: "hsl(var(--chart-9))",
    },
  };

  const availableSensors = [
    { id: 'temperature', label: 'Temperature (°C)', color: 'hsl(var(--chart-1))' },
    { id: 'humidity', label: 'Humidity (%)', color: 'hsl(var(--chart-2))' },
    { id: 'pressure', label: 'Pressure (hPa)', color: 'hsl(var(--chart-3))' },
    { id: 'pm25', label: 'PM2.5 (μg/m³)', color: 'hsl(var(--chart-4))' },
    { id: 'pm1', label: 'PM1.0 (μg/m³)', color: 'hsl(var(--chart-5))' },
    { id: 'pm10', label: 'PM10 (μg/m³)', color: 'hsl(var(--chart-6))' },
    { id: 'gas_resistance', label: 'Gas Resistance (Ω)', color: 'hsl(var(--chart-7))' },
    { id: 'accel_magnitude', label: 'Acceleration (m/s²)', color: 'hsl(var(--chart-8))' },
    { id: 'gyro_magnitude', label: 'Gyroscope (°/s)', color: 'hsl(var(--chart-9))' },
  ];

  const toggleSensorSelection = (sensorId: string) => {
    setSelectedSensors(prev => 
      prev.includes(sensorId) 
        ? prev.filter(id => id !== sensorId)
        : [...prev, sensorId]
    );
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
              {(() => {
                // processed_sensor_readings.recorded_at is already in Singapore time
                const singaporeDate = new Date(latestReading.recorded_at);
                return singaporeDate.toLocaleString();
              })()}
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
                Real-time data from your AWS RDS sensor network ({timeSeriesData.length} chart points from {isLoading ? 'Loading...' : sensorReadings?.length || 0} total readings)
                {timeSeriesData.length === 0 && !isLoading && (
                  <span className="text-orange-500 font-medium"> • No data in selected timeframe - check RDS sync</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Sensor Multi-Select */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between">
                    {selectedSensors.length === availableSensors.length 
                      ? "All Sensors" 
                      : `${selectedSensors.length} Selected`}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <div className="p-4">
                    <div className="text-sm font-medium mb-3">Select Sensors to Display</div>
                    <div className="space-y-2">
                      {availableSensors.map((sensor) => (
                        <div key={sensor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={sensor.id}
                            checked={selectedSensors.includes(sensor.id)}
                            onCheckedChange={() => toggleSensorSelection(sensor.id)}
                          />
                          <label
                            htmlFor={sensor.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: sensor.color }}
                            />
                            {sensor.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedSensors(availableSensors.map(s => s.id))}
                        className="flex-1"
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedSensors([])}
                        className="flex-1"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Time Range Select */}
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
                  {selectedSensors.map((sensorId) => {
                    const sensorConfig = availableSensors.find(s => s.id === sensorId);
                    if (!sensorConfig) return null;
                    
                    return (
                      <Line 
                        key={sensorId}
                        type="monotone" 
                        dataKey={sensorId} 
                        stroke={sensorConfig.color} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: sensorConfig.color }}
                      />
                    );
                  })}
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