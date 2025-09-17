
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { 
  Clock, 
  Zap, 
  TrendingDown, 
  Calendar,
  AlertCircle,
  Target,
  Timer,
  Loader2
} from "lucide-react";
import { useLongevityMetrics } from "@/hooks/useLongevityMetrics";
import { format } from 'date-fns';

const SystemLongevity = () => {
  const { 
    currentUptime, 
    longevityMetrics, 
    componentLifespan, 
    monthlyUptimeData,
    isLoading, 
    error 
  } = useLongevityMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading longevity metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error loading longevity data: {error}</span>
        </div>
      </Card>
    );
  }

  const chartConfig = {
    uptime: { label: "Uptime (%)", color: "#22c55e" },
    downtime: { label: "Downtime (%)", color: "#ef4444" },
    incidents: { label: "Incidents", color: "#f59e0b" }
  };

  const getHealthColor = (value: number) => {
    if (value >= 90) return "text-green-600";
    if (value >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getLifespanPercentage = (current: number, expected: number) => {
    return Math.round((current / expected) * 100);
  };

  const formatRemainingLife = (remainingYears: number) => {
    const years = Math.floor(remainingYears);
    const months = Math.round((remainingYears - years) * 12);
    
    if (years === 0 && months === 0) {
      return "< 1 month";
    } else if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years}y ${months}m`;
    }
  };

  const getFactorColor = (level: string): string => {
    switch (level) {
      case 'Low':
        return 'text-green-600 bg-green-100';
      case 'Normal':
      case 'Moderate':
        return 'text-blue-600 bg-blue-100';
      case 'High':
        return 'text-yellow-600 bg-yellow-100';
      case 'Critical':
      case 'Very High':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Uptime</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentUptime.uptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
            <Badge className={`mt-2 ${currentUptime.uptime >= 99 ? 'text-green-600 bg-green-100' : 
              currentUptime.uptime >= 95 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'}`}>
              {currentUptime.uptime >= 99 ? 'Excellent' : 
               currentUptime.uptime >= 95 ? 'Good' : 'Needs Attention'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{currentUptime.totalDowntimeHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
            <Badge className={`mt-2 ${currentUptime.incidents <= 2 ? 'text-green-600 bg-green-100' : 
              currentUptime.incidents <= 5 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'}`}>
              {currentUptime.incidents} incident{currentUptime.incidents !== 1 ? 's' : ''}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Lifespan</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatRemainingLife(longevityMetrics.predictedRemainingLife)}</div>
            <p className="text-xs text-muted-foreground">
              Remaining operational life
            </p>
            <Progress value={(longevityMetrics.predictedRemainingLife / longevityMetrics.expectedLifespan) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Degradation Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{longevityMetrics.degradationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Per year
            </p>
            <Badge className="mt-2 text-green-600 bg-green-100">
              Within normal range
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Uptime Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            System Uptime & Downtime Trends
          </CardTitle>
          <CardDescription>
            Monthly system availability and incident tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyUptimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="var(--color-uptime)" 
                  strokeWidth={3}
                  dot={{ fill: "var(--color-uptime)", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="downtime" 
                  stroke="var(--color-downtime)" 
                  strokeWidth={2}
                  dot={{ fill: "var(--color-downtime)", strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Component Lifespan Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Component Lifespan Analysis
          </CardTitle>
          <CardDescription>
            Current age vs expected lifespan for critical components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {componentLifespan.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{component.component}</p>
                  <p className="text-sm text-muted-foreground">
                    {component.current}y / {component.expected}y expected
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Progress value={getLifespanPercentage(component.current, component.expected)} />
                    <p className="text-xs text-center mt-1">
                      {getLifespanPercentage(component.current, component.expected)}% aged
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getHealthColor(component.health)}`}>
                      {component.health}%
                    </p>
                    <p className="text-xs text-muted-foreground">Health</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Longevity Predictions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Maintenance Efficiency
            </CardTitle>
            <CardDescription>Impact of maintenance on system longevity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Preventive Maintenance</span>
                <span className="text-sm text-muted-foreground">{longevityMetrics.maintenanceEfficiency}%</span>
              </div>
              <Progress value={longevityMetrics.maintenanceEfficiency} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cost Efficiency</span>
                <span className="text-sm text-muted-foreground">{longevityMetrics.costEfficiency}%</span>
              </div>
              <Progress value={longevityMetrics.costEfficiency} />
            </div>
            <Badge className={`w-full justify-center ${longevityMetrics.maintenanceEfficiency >= 85 ? 
              'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
              {longevityMetrics.maintenanceEfficiency >= 85 ? 
                'Optimal maintenance schedule detected' : 
                'Maintenance schedule needs optimization'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Longevity Factors</CardTitle>
            <CardDescription>Key factors affecting hangar lifespan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Environmental Conditions</span>
              <Badge className="text-green-600 bg-green-100">Good</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Structural Integrity</span>
              <Badge className="text-green-600 bg-green-100">Excellent</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Equipment Wear</span>
              <Badge className={`${getFactorColor(longevityMetrics.equipmentWear.level)}`}>
                {longevityMetrics.equipmentWear.level}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Maintenance Quality</span>
              <Badge className="text-green-600 bg-green-100">High</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Usage Intensity</span>
              <Badge className={`${getFactorColor(longevityMetrics.usageIntensity.level)}`}>
                {longevityMetrics.usageIntensity.level}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { SystemLongevity };
