import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { SingaporeAQICard } from "./SingaporeAQICard";

const AirQualityPanel = () => {
  const { sensorReadings, isLoading } = useSensorData();

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
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
      {/* Singapore Real-Time Air Quality Status */}
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Singapore Air Quality Index (Real-Time)</CardTitle>
            <CardDescription>Live air quality data from Singapore's monitoring stations - Taken from WAQI</CardDescription>
          </div>
          <CheckCircle className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <SingaporeAQICard />
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