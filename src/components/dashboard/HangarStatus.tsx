
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Wrench,
  Activity,
  Eye
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";

const HangarStatus = () => {
  const { sensorReadings, dashboardData, isLoading } = useSensorData();
  
  // Get latest readings or use defaults
  const latestReading = sensorReadings[0];
  const dashStats = dashboardData[0];
  
  const currentReadings = {
    temperature: { 
      value: latestReading?.temperature?.toFixed(3) || "N/A", 
      unit: "°C", 
      status: latestReading?.temperature && latestReading.temperature >= 18 && latestReading.temperature <= 25 ? "normal" : "warning", 
      threshold: "18-25°C" 
    },
    humidity: { 
      value: latestReading?.humidity?.toFixed(3) || "N/A", 
      unit: "%", 
      status: latestReading?.humidity && latestReading.humidity < 70 ? "normal" : "warning", 
      threshold: "<70%" 
    },
    airQuality: { 
      value: latestReading?.pm2_5 || "N/A", 
      unit: "μg/m³", 
      status: latestReading?.pm2_5 && latestReading.pm2_5 < 35 ? "good" : "warning", 
      threshold: "<35 μg/m³" 
    },
    pressure: { 
      value: latestReading?.pressure?.toFixed(3) || "N/A", 
      unit: "hPa", 
      status: latestReading?.pressure && latestReading.pressure >= 1010 && latestReading.pressure <= 1020 ? "normal" : "warning", 
      threshold: "1010-1020" 
    }
  };

  const systemHealth = {
    overallScore: dashStats?.avg_anomaly_score ? Math.round((1 - dashStats.avg_anomaly_score) * 100) : 94,
    lastMaintenance: latestReading ? `${Math.floor((Date.now() - new Date(latestReading.recorded_at).getTime()) / (1000 * 60 * 60 * 24))} days ago` : "Unknown",
    nextMaintenance: "in 15 days",
    activeAlerts: dashStats ? dashStats.high_anomaly_count + dashStats.high_risk_count : 0,
    sensorsOnline: sensorReadings.length > 0 ? 9 : 0, // 9 sensor types
    totalSensors: 9
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
      case "normal":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Current Environmental Readings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temperature</CardTitle>
          <Thermometer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentReadings.temperature.value}{currentReadings.temperature.unit}</div>
          <p className="text-xs text-muted-foreground">
            Threshold: {currentReadings.temperature.threshold}
          </p>
          <Badge className={`mt-2 ${getStatusColor(currentReadings.temperature.status)}`}>
            {currentReadings.temperature.status}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Humidity</CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentReadings.humidity.value}{currentReadings.humidity.unit}</div>
          <p className="text-xs text-muted-foreground">
            Threshold: {currentReadings.humidity.threshold}
          </p>
          <Badge className={`mt-2 ${getStatusColor(currentReadings.humidity.status)}`}>
            {currentReadings.humidity.status}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Air Quality</CardTitle>
          <Wind className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentReadings.airQuality.value} {currentReadings.airQuality.unit}</div>
          <p className="text-xs text-muted-foreground">
            Threshold: {currentReadings.airQuality.threshold}
          </p>
          <Badge className={`mt-2 ${getStatusColor(currentReadings.airQuality.status)}`}>
            {currentReadings.airQuality.status}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pressure</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentReadings.pressure.value} {currentReadings.pressure.unit}</div>
          <p className="text-xs text-muted-foreground">
            Threshold: {currentReadings.pressure.threshold}
          </p>
          <Badge className={`mt-2 ${getStatusColor(currentReadings.pressure.status)}`}>
            {currentReadings.pressure.status}
          </Badge>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            System Health Score
          </CardTitle>
          <CardDescription>Overall hangar condition assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-sm text-muted-foreground">{systemHealth.overallScore}/100</span>
            </div>
            <Progress value={systemHealth.overallScore} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Sensors Online: {systemHealth.sensorsOnline}/{systemHealth.totalSensors}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span>Active Alerts: {systemHealth.activeAlerts}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Schedule */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Maintenance Schedule
          </CardTitle>
          <CardDescription>Upcoming and recent maintenance activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Last Maintenance</span>
              </div>
              <p className="text-sm text-muted-foreground">{systemHealth.lastMaintenance}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Next Scheduled</span>
              </div>
              <p className="text-sm text-blue-600 font-medium">{systemHealth.nextMaintenance}</p>
            </div>
          </div>
          <div className="pt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Structural Check Due Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { HangarStatus };
