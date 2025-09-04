
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { 
  Activity, 
  Mountain, 
  Plane, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Waves
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState } from "react";

const VibrationMonitoring = () => {
  const { sensorReadings, isLoading, getSensorReadingsByTimeRange } = useSensorData();
  const [accelerometerData, setAccelerometerData] = useState([]);
  const [gyroscopeData, setGyroscopeData] = useState([]);

  useEffect(() => {
    const loadVibrationData = async () => {
      const data = await getSensorReadingsByTimeRange(24);
      
      // Process accelerometer data (ground vibration)
      const accelData = data.map(reading => ({
        time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        amplitude: reading.accel_magnitude || 0,
        x: reading.accel_x || 0,
        y: reading.accel_y || 0,
        z: reading.accel_z || 0,
        severity: reading.accel_magnitude > 0.3 ? "high" : reading.accel_magnitude > 0.15 ? "medium" : "low"
      })).slice(-20);
      
      // Process gyroscope data (rotational vibration)  
      const gyroData = data.map(reading => ({
        time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        amplitude: reading.gyro_magnitude || 0,
        x: reading.gyro_x || 0,
        y: reading.gyro_y || 0,
        z: reading.gyro_z || 0,
        severity: reading.gyro_magnitude > 0.2 ? "high" : reading.gyro_magnitude > 0.1 ? "medium" : "low"
      })).slice(-20);

      setAccelerometerData(accelData);
      setGyroscopeData(gyroData);
    };

    if (!isLoading) {
      loadVibrationData();
    }
  }, [getSensorReadingsByTimeRange, isLoading]);

  // Get latest readings for current status
  const latestReading = sensorReadings[0];

  const structuralImpact = {
    foundationStress: 23, // percentage
    wallIntegrity: 94,
    roofStability: 87,
    overallHealth: 88
  };

  const chartConfig = {
    amplitude: { label: "Amplitude (m/s²)", color: "#ef4444" },
    frequency: { label: "Frequency (Hz)", color: "#3b82f6" }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getHealthColor = (value: number) => {
    if (value >= 90) return "text-green-600";
    if (value >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Current Vibration Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ground Vibration</CardTitle>
            <Mountain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestReading?.accel_magnitude?.toFixed(2) || "0.00"} m/s²
            </div>
            <p className="text-xs text-muted-foreground">
              Current acceleration magnitude
            </p>
            <Badge className={`mt-2 ${getSeverityColor(
              latestReading?.accel_magnitude > 0.3 ? "high" : 
              latestReading?.accel_magnitude > 0.15 ? "medium" : "low"
            )}`}>
              {latestReading?.accel_magnitude > 0.3 ? "High" : 
               latestReading?.accel_magnitude > 0.15 ? "Medium" : "Low"} Impact
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotational Motion</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestReading?.gyro_magnitude?.toFixed(2) || "0.00"} °/s
            </div>
            <p className="text-xs text-muted-foreground">
              Current gyroscope magnitude
            </p>
            <Badge className={`mt-2 ${getSeverityColor(
              latestReading?.gyro_magnitude > 0.2 ? "high" : 
              latestReading?.gyro_magnitude > 0.1 ? "medium" : "low"
            )}`}>
              {latestReading?.gyro_magnitude > 0.2 ? "High" : 
               latestReading?.gyro_magnitude > 0.1 ? "Medium" : "Low"} Impact
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foundation Stress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structuralImpact.foundationStress}%</div>
            <p className="text-xs text-muted-foreground">
              Stress level
            </p>
            <Progress value={structuralImpact.foundationStress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structural Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(structuralImpact.overallHealth)}`}>
              {structuralImpact.overallHealth}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall condition
            </p>
            <Progress value={structuralImpact.overallHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Vibration Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-5 w-5" />
              Accelerometer Analysis
            </CardTitle>
            <CardDescription>
              Linear acceleration affecting hangar structure (X, Y, Z axes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accelerometerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="amplitude" 
                    stroke="var(--color-amplitude)" 
                    fill="var(--color-amplitude)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5" />
              Gyroscope Analysis
            </CardTitle>
            <CardDescription>
              Rotational motion and angular velocity affecting hangar stability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gyroscopeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="amplitude" 
                    stroke="var(--color-frequency)" 
                    fill="var(--color-frequency)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Structural Impact Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Structural Impact Assessment
          </CardTitle>
          <CardDescription>
            How vibrations affect different components of the storage hangar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Foundation Integrity</p>
                <p className="text-sm text-muted-foreground">Ground vibration impact on foundation</p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={100 - structuralImpact.foundationStress} className="w-20" />
                <span className={`text-sm font-medium ${getHealthColor(100 - structuralImpact.foundationStress)}`}>
                  {100 - structuralImpact.foundationStress}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Wall Integrity</p>
                <p className="text-sm text-muted-foreground">Lateral force resistance</p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={structuralImpact.wallIntegrity} className="w-20" />
                <span className={`text-sm font-medium ${getHealthColor(structuralImpact.wallIntegrity)}`}>
                  {structuralImpact.wallIntegrity}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Roof Stability</p>
                <p className="text-sm text-muted-foreground">Wind load and air vibration resistance</p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={structuralImpact.roofStability} className="w-20" />
                <span className={`text-sm font-medium ${getHealthColor(structuralImpact.roofStability)}`}>
                  {structuralImpact.roofStability}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { VibrationMonitoring };
