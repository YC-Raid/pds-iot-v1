
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
  TrendingUp
} from "lucide-react";

const VibrationMonitoring = () => {
  // Mock vibration data
  const groundVibrationData = [
    { time: "00:00", amplitude: 0.12, frequency: 8.5, severity: "low" },
    { time: "04:00", amplitude: 0.08, frequency: 6.2, severity: "low" },
    { time: "08:00", amplitude: 0.25, frequency: 12.1, severity: "medium" },
    { time: "12:00", amplitude: 0.35, frequency: 15.8, severity: "high" },
    { time: "16:00", amplitude: 0.22, frequency: 11.3, severity: "medium" },
    { time: "20:00", amplitude: 0.15, frequency: 9.1, severity: "low" },
  ];

  const airVibrationData = [
    { time: "00:00", amplitude: 0.05, frequency: 2.1, severity: "low" },
    { time: "04:00", amplitude: 0.03, frequency: 1.8, severity: "low" },
    { time: "08:00", amplitude: 0.18, frequency: 4.2, severity: "medium" },
    { time: "12:00", amplitude: 0.28, frequency: 6.5, severity: "high" },
    { time: "16:00", amplitude: 0.12, frequency: 3.1, severity: "medium" },
    { time: "20:00", amplitude: 0.07, frequency: 2.3, severity: "low" },
  ];

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
            <div className="text-2xl font-bold">0.25 m/s²</div>
            <p className="text-xs text-muted-foreground">
              Current amplitude
            </p>
            <Badge className={`mt-2 ${getSeverityColor("medium")}`}>
              Medium Impact
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Air Vibration</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.12 m/s²</div>
            <p className="text-xs text-muted-foreground">
              Current amplitude
            </p>
            <Badge className={`mt-2 ${getSeverityColor("low")}`}>
              Low Impact
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
              Ground Vibration Analysis
            </CardTitle>
            <CardDescription>
              Seismic activity and ground-based vibrations affecting structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={groundVibrationData}>
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
              <Plane className="h-5 w-5" />
              Air Vibration Analysis
            </CardTitle>
            <CardDescription>
              Wind loads and aerial disturbances affecting hangar stability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={airVibrationData}>
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
