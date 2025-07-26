
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
  Wrench
} from "lucide-react";

const HangarStatus = () => {
  // Mock data - replace with real sensor data
  const currentReadings = {
    temperature: { value: 22.5, unit: "°C", status: "normal", threshold: "18-25°C" },
    humidity: { value: 65, unit: "%", status: "normal", threshold: "<70%" },
    airQuality: { value: 85, unit: "AQI", status: "good", threshold: ">80" },
    pressure: { value: 1013.2, unit: "hPa", status: "normal", threshold: "1010-1020" }
  };

  const systemHealth = {
    overallScore: 94,
    lastMaintenance: "15 days ago",
    nextMaintenance: "in 15 days",
    activeAlerts: 2,
    sensorsOnline: 12,
    totalSensors: 12
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
