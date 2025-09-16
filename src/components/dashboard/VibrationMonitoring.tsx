
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
import { supabase } from "@/integrations/supabase/client";

const VibrationMonitoring = () => {
  const { sensorReadings, isLoading, getSensorReadingsByTimeRange } = useSensorData();
  const [accelerometerData, setAccelerometerData] = useState([]);
  const [gyroscopeData, setGyroscopeData] = useState([]);
  const [structuralHealth, setStructuralHealth] = useState({
    foundationStress: 0,
    wallIntegrity: 100,
    roofStability: 100,
    overallHealth: 100
  });
  const [thresholds, setThresholds] = useState({
    foundation_stress_threshold: 2.0,
    wall_integrity_threshold: 1.5,
    roof_stability_threshold: 1.0
  });

  // Calculate proper acceleration magnitude accounting for gravity
  const calculateCorrectedAccelMagnitude = (x: number, y: number, z: number) => {
    // Remove gravity component (Y-axis is vertical based on sensor data)
    const correctedY = y + 9.81; // Add 9.81 since sensor shows -9.6 at rest (negative gravity)
    return Math.sqrt(x * x + correctedY * correctedY + z * z);
  };

  // Calculate structural health metrics based on vibration data
  const calculateStructuralHealth = (data: any[]) => {
    if (!data || data.length === 0) return;

    // Calculate average values for the last 24 hours
    const avgAccelMagnitude = data.reduce((sum, reading) => {
      const correctedMag = calculateCorrectedAccelMagnitude(
        reading.accel_x || 0, 
        reading.accel_y || 0, 
        reading.accel_z || 0
      );
      return sum + correctedMag;
    }, 0) / data.length;

    const avgGyroMagnitude = data.reduce((sum, reading) => {
      const gyroMag = Math.sqrt(
        Math.pow(reading.gyro_x || 0, 2) + 
        Math.pow(reading.gyro_y || 0, 2) + 
        Math.pow(reading.gyro_z || 0, 2)
      );
      return sum + gyroMag;
    }, 0) / data.length;

    // Calculate lateral forces (X and Z axis only, excluding gravity-affected Y axis)
    const avgLateralForce = data.reduce((sum, reading) => {
      return sum + Math.sqrt(Math.pow(reading.accel_x || 0, 2) + Math.pow(reading.accel_z || 0, 2));
    }, 0) / data.length;

    // Calculate foundation stress using configurable threshold
    const foundationStress = Math.min(100, (avgAccelMagnitude / thresholds.foundation_stress_threshold) * 100);

    // Calculate wall integrity damage using configurable threshold
    const wallDamage = Math.min(100, (avgLateralForce / thresholds.wall_integrity_threshold) * 100);

    // Calculate roof stability damage using configurable threshold
    const roofDamage = Math.min(100, (avgGyroMagnitude / thresholds.roof_stability_threshold) * 100);

    // Overall health: 100% minus weighted damage components
    const overallHealth = Math.max(0, 100 - (
      foundationStress * 0.4 + 
      wallDamage * 0.3 + 
      roofDamage * 0.3
    ));

    // Convert damage back to integrity percentages for display
    const wallIntegrity = 100 - wallDamage;
    const roofStability = 100 - roofDamage;

    setStructuralHealth({
      foundationStress: Math.round(foundationStress),
      wallIntegrity: Math.round(wallIntegrity),
      roofStability: Math.round(roofStability),
      overallHealth: Math.round(overallHealth)
    });
  };

  // Fetch vibration monitoring thresholds
  useEffect(() => {
    const fetchThresholds = async () => {
      const { data, error } = await supabase
        .from('vibration_monitoring_settings')
        .select('*')
        .eq('location', 'hangar_01')
        .maybeSingle();
      
      if (data && !error) {
        setThresholds({
          foundation_stress_threshold: data.foundation_stress_threshold,
          wall_integrity_threshold: data.wall_integrity_threshold,
          roof_stability_threshold: data.roof_stability_threshold
        });
      }
    };

    fetchThresholds();
  }, []);

  useEffect(() => {
    const loadVibrationData = async () => {
      const data = await getSensorReadingsByTimeRange(24);
      
      // Calculate structural health from raw data
      calculateStructuralHealth(data);
      
      // Process accelerometer data with corrected magnitudes
      const accelData = data.map(reading => {
        const correctedMagnitude = calculateCorrectedAccelMagnitude(
          reading.accel_x || 0, 
          reading.accel_y || 0, 
          reading.accel_z || 0
        );
        
        return {
          time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          amplitude: correctedMagnitude,
          x: reading.accel_x || 0,
          y: reading.accel_y || 0,
          z: reading.accel_z || 0,
          severity: correctedMagnitude > 0.3 ? "high" : correctedMagnitude > 0.15 ? "medium" : "low"
        };
      }).slice(-20);
      
      // Process gyroscope data with proper magnitude calculation
      const gyroData = data.map(reading => {
        const gyroMagnitude = Math.sqrt(
          Math.pow(reading.gyro_x || 0, 2) + 
          Math.pow(reading.gyro_y || 0, 2) + 
          Math.pow(reading.gyro_z || 0, 2)
        );
        
        return {
          time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          amplitude: gyroMagnitude,
          x: reading.gyro_x || 0,
          y: reading.gyro_y || 0,
          z: reading.gyro_z || 0,
          severity: gyroMagnitude > 0.2 ? "high" : gyroMagnitude > 0.1 ? "medium" : "low"
        };
      }).slice(-20);

      setAccelerometerData(accelData);
      setGyroscopeData(gyroData);
    };

    if (!isLoading) {
      loadVibrationData();
    }
  }, [getSensorReadingsByTimeRange, isLoading]);

  // Get latest readings for current status and calculate corrected values
  const latestReading = sensorReadings[0];
  const latestCorrectedAccelMag = latestReading ? calculateCorrectedAccelMagnitude(
    latestReading.accel_x || 0,
    latestReading.accel_y || 0, 
    latestReading.accel_z || 0
  ) : 0;
  
  const latestCorrectedGyroMag = latestReading ? Math.sqrt(
    Math.pow(latestReading.gyro_x || 0, 2) +
    Math.pow(latestReading.gyro_y || 0, 2) +
    Math.pow(latestReading.gyro_z || 0, 2)
  ) : 0;

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
              {latestCorrectedAccelMag.toFixed(2)} m/s²
            </div>
            <p className="text-xs text-muted-foreground">
              Ground acceleration (gravity corrected)
            </p>
            <Badge className={`mt-2 ${getSeverityColor(
              latestCorrectedAccelMag > 0.3 ? "high" : 
              latestCorrectedAccelMag > 0.15 ? "medium" : "low"
            )}`}>
              {latestCorrectedAccelMag > 0.3 ? "High" : 
               latestCorrectedAccelMag > 0.15 ? "Medium" : "Low"} Impact
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
              {latestCorrectedGyroMag.toFixed(2)} °/s
            </div>
            <p className="text-xs text-muted-foreground">
              Angular velocity magnitude
            </p>
            <Badge className={`mt-2 ${getSeverityColor(
              latestCorrectedGyroMag > 0.2 ? "high" : 
              latestCorrectedGyroMag > 0.1 ? "medium" : "low"
            )}`}>
              {latestCorrectedGyroMag > 0.2 ? "High" : 
               latestCorrectedGyroMag > 0.1 ? "Medium" : "Low"} Impact
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foundation Stress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structuralHealth.foundationStress}%</div>
            <p className="text-xs text-muted-foreground">
              Based on ground vibration data
            </p>
            <Progress value={structuralHealth.foundationStress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structural Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(structuralHealth.overallHealth)}`}>
              {structuralHealth.overallHealth}%
            </div>
            <p className="text-xs text-muted-foreground">
              Calculated from vibration metrics
            </p>
            <Progress value={structuralHealth.overallHealth} className="mt-2" />
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
                <Progress value={100 - structuralHealth.foundationStress} className="w-20" />
                <span className={`text-sm font-medium ${getHealthColor(100 - structuralHealth.foundationStress)}`}>
                  {100 - structuralHealth.foundationStress}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Wall Integrity</p>
                <p className="text-sm text-muted-foreground">Lateral force resistance</p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={structuralHealth.wallIntegrity} className="w-20" />
                <span className={`text-sm font-medium ${getHealthColor(structuralHealth.wallIntegrity)}`}>
                  {structuralHealth.wallIntegrity}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Roof Stability</p>
                <p className="text-sm text-muted-foreground">Wind load and air vibration resistance</p>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={structuralHealth.roofStability} className="w-20" />
                <span className={`text-sm font-medium ${getHealthColor(structuralHealth.roofStability)}`}>
                  {structuralHealth.roofStability}%
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
