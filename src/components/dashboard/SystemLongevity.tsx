
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
  Timer
} from "lucide-react";

const SystemLongevity = () => {
  const uptimeData = [
    { month: "Jul", uptime: 99.2, downtime: 0.8, incidents: 3 },
    { month: "Aug", uptime: 98.7, downtime: 1.3, incidents: 5 },
    { month: "Sep", uptime: 99.8, downtime: 0.2, incidents: 1 },
    { month: "Oct", uptime: 99.4, downtime: 0.6, incidents: 2 },
    { month: "Nov", uptime: 99.1, downtime: 0.9, incidents: 4 },
    { month: "Dec", uptime: 99.6, downtime: 0.4, incidents: 2 }
  ];

  const longevityMetrics = {
    expectedLifespan: 25, // years
    currentAge: 8, // years
    degradationRate: 2.3, // % per year
    predictedRemainingLife: 15.2, // years
    maintenanceEfficiency: 87, // %
    costEfficiency: 94 // %
  };

  const componentLifespan = [
    { component: "HVAC System", current: 12, expected: 15, health: 80 },
    { component: "Structural Steel", current: 8, expected: 50, health: 95 },
    { component: "Electrical Systems", current: 6, expected: 20, health: 88 },
    { component: "Sensors Network", current: 3, expected: 10, health: 92 },
    { component: "Door Mechanisms", current: 8, expected: 12, health: 67 },
  ];

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
            <div className="text-2xl font-bold text-green-600">99.6%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
            <Badge className="mt-2 text-green-600 bg-green-100">
              Excellent
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2.8h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
            <Badge className="mt-2 text-yellow-600 bg-yellow-100">
              2 incidents
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Lifespan</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{longevityMetrics.predictedRemainingLife}y</div>
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
              <LineChart data={uptimeData}>
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
            <Badge className="w-full justify-center text-green-600 bg-green-100">
              Optimal maintenance schedule detected
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
              <Badge className="text-yellow-600 bg-yellow-100">Moderate</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Maintenance Quality</span>
              <Badge className="text-green-600 bg-green-100">High</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Usage Intensity</span>
              <Badge className="text-blue-600 bg-blue-100">Normal</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { SystemLongevity };
