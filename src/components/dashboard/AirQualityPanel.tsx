import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { 
  Wind, 
  Eye,
  Cloud,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Thermometer,
  Droplets
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState } from "react";

const AirQualityPanel = () => {
  const { sensorReadings, isLoading, getSensorReadingsByTimeRange } = useSensorData();
  const [airQualityData, setAirQualityData] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState([]);

  useEffect(() => {
    const loadAirQualityData = async () => {
      const data = await getSensorReadingsByTimeRange(24);
      
      // Process PM sensor data
      const pmData = data.map(reading => ({
        time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        pm1_0: reading.pm1_0 || 0,
        pm2_5: reading.pm2_5 || 0,
        pm10: reading.pm10 || 0,
        total_pm: (reading.pm1_0 || 0) + (reading.pm2_5 || 0) + (reading.pm10 || 0)
      })).slice(-20);
      
      // Process environmental factors affecting air quality
      const envData = data.map(reading => ({
        time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        temperature: reading.temperature || 0,
        humidity: reading.humidity || 0,
        gas_resistance: reading.gas_resistance || 0,
        air_quality_index: calculateAQI(reading.pm2_5 || 0)
      })).slice(-20);

      setAirQualityData(pmData);
      setEnvironmentalData(envData);
    };

    if (!isLoading) {
      loadAirQualityData();
    }
  }, [getSensorReadingsByTimeRange, isLoading]);

  // Calculate Air Quality Index from PM2.5
  const calculateAQI = (pm25: number) => {
    if (pm25 <= 12) return 50; // Good
    if (pm25 <= 35) return 100; // Moderate
    if (pm25 <= 55) return 150; // Unhealthy for sensitive groups
    if (pm25 <= 150) return 200; // Unhealthy
    return 300; // Hazardous
  };

  const getAQILevel = (aqi: number) => {
    if (aqi <= 50) return { level: "Good", color: "text-green-600 bg-green-100" };
    if (aqi <= 100) return { level: "Moderate", color: "text-yellow-600 bg-yellow-100" };
    if (aqi <= 150) return { level: "Unhealthy for Sensitive", color: "text-orange-600 bg-orange-100" };
    if (aqi <= 200) return { level: "Unhealthy", color: "text-red-600 bg-red-100" };
    return { level: "Hazardous", color: "text-purple-600 bg-purple-100" };
  };

  // Get latest readings
  const latestReading = sensorReadings[0];
  const currentAQI = latestReading ? calculateAQI(latestReading.pm2_5 || 0) : 0;
  const aqiInfo = getAQILevel(currentAQI);

  const chartConfig = {
    pm1_0: { label: "PM1.0", color: "hsl(var(--chart-1))" },
    pm2_5: { label: "PM2.5", color: "hsl(var(--chart-2))" },
    pm10: { label: "PM10", color: "hsl(var(--chart-3))" },
    temperature: { label: "Temperature", color: "hsl(var(--chart-4))" },
    humidity: { label: "Humidity", color: "hsl(var(--chart-5))" },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-4 w-48 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Air Quality Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PM1.0</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading?.pm1_0 || 0}</div>
            <p className="text-xs text-muted-foreground">μg/m³</p>
            <Progress value={Math.min((latestReading?.pm1_0 || 0) / 50 * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PM2.5</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading?.pm2_5 || 0}</div>
            <p className="text-xs text-muted-foreground">μg/m³</p>
            <Progress value={Math.min((latestReading?.pm2_5 || 0) / 35 * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PM10</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReading?.pm10 || 0}</div>
            <p className="text-xs text-muted-foreground">μg/m³</p>
            <Progress value={Math.min((latestReading?.pm10 || 0) / 150 * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Air Quality Index</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentAQI}</div>
            <p className="text-xs text-muted-foreground">AQI Score</p>
            <Badge className={`mt-2 ${aqiInfo.color}`}>
              {aqiInfo.level}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Particulate Matter Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Particulate Matter Levels - 24 Hour Trend
          </CardTitle>
          <CardDescription>
            Real-time monitoring of PM1.0, PM2.5, and PM10 concentrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={airQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pm1_0" fill="hsl(var(--chart-1))" name="PM1.0" />
                <Bar dataKey="pm2_5" fill="hsl(var(--chart-2))" name="PM2.5" />
                <Bar dataKey="pm10" fill="hsl(var(--chart-3))" name="PM10" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>


      {/* Air Quality Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Air Quality Assessment & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Current Air Quality Status</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Air quality is currently <span className="font-medium">{aqiInfo.level.toLowerCase()}</span> with an AQI of {currentAQI}.
                PM2.5 levels are at {latestReading?.pm2_5 || 0} μg/m³.
              </p>
            </div>

            {currentAQI > 100 && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h4 className="font-medium">Air Quality Alert</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Air quality levels are above recommended thresholds. Consider increasing ventilation 
                  and monitoring for potential sources of particulate matter.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium mb-2">Maintenance Recommendations</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check air filtration systems monthly</li>
                  <li>• Monitor humidity levels (target: 40-60%)</li>
                  <li>• Inspect for dust accumulation sources</li>
                </ul>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium mb-2">Health & Safety</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PM2.5 &lt; 12 μg/m³ recommended</li>
                  <li>• PM10 &lt; 50 μg/m³ for good air quality</li>
                  <li>• Consider masks if AQI &gt; 150</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { AirQualityPanel };