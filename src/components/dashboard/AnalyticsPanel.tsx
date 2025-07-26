
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Calendar
} from "lucide-react";

const AnalyticsPanel = () => {
  // Mock historical data - replace with real data
  const weeklyTrends = [
    { day: "Mon", temperature: 22.1, humidity: 68, airQuality: 82, alerts: 3 },
    { day: "Tue", temperature: 21.8, humidity: 70, airQuality: 85, alerts: 1 },
    { day: "Wed", temperature: 23.2, humidity: 65, airQuality: 88, alerts: 2 },
    { day: "Thu", temperature: 24.1, humidity: 62, airQuality: 91, alerts: 0 },
    { day: "Fri", temperature: 23.5, humidity: 64, airQuality: 87, alerts: 1 },
    { day: "Sat", temperature: 22.8, humidity: 66, airQuality: 85, alerts: 2 },
    { day: "Sun", temperature: 22.3, humidity: 68, airQuality: 84, alerts: 1 }
  ];

  const monthlyData = [
    { month: "Aug", avgTemp: 23.2, avgHumidity: 65, maintenanceHours: 8, downtime: 0.5 },
    { month: "Sep", avgTemp: 22.8, avgHumidity: 67, maintenanceHours: 12, downtime: 1.2 },
    { month: "Oct", avgTemp: 21.5, avgHumidity: 69, maintenanceHours: 6, downtime: 0.3 },
    { month: "Nov", avgTemp: 20.8, avgHumidity: 71, maintenanceHours: 15, downtime: 2.1 },
    { month: "Dec", avgTemp: 20.2, avgHumidity: 73, maintenanceHours: 10, downtime: 0.8 },
    { month: "Jan", avgTemp: 22.5, avgHumidity: 65, maintenanceHours: 8, downtime: 0.4 }
  ];

  const systemHealth = [
    { name: "Excellent", value: 65, color: "#22c55e" },
    { name: "Good", value: 25, color: "#3b82f6" },
    { name: "Warning", value: 8, color: "#f59e0b" },
    { name: "Critical", value: 2, color: "#ef4444" }
  ];

  const predictiveInsights = [
    {
      title: "Temperature Trend",
      prediction: "Stable with seasonal variation",
      confidence: 92,
      trend: "stable",
      nextAction: "No action required",
      timeframe: "Next 30 days"
    },
    {
      title: "Humidity Control",
      prediction: "Slight increase expected",
      confidence: 78,
      trend: "up",
      nextAction: "Monitor dehumidifier",
      timeframe: "Next 14 days"
    },
    {
      title: "Air Quality",
      prediction: "Gradual improvement",
      confidence: 85,
      trend: "up",
      nextAction: "Continue current settings",
      timeframe: "Next 21 days"
    },
    {
      title: "System Health",
      prediction: "Maintenance needed soon",
      confidence: 89,
      trend: "down",
      nextAction: "Schedule calibration",
      timeframe: "Next 7 days"
    }
  ];

  const chartConfig = {
    temperature: {
      label: "Temperature (°C)",
      color: "hsl(var(--chart-1))",
    },
    humidity: {
      label: "Humidity (%)",
      color: "hsl(var(--chart-2))",
    },
    airQuality: {
      label: "Air Quality (AQI)",
      color: "hsl(var(--chart-3))",
    },
    alerts: {
      label: "Alerts",
      color: "hsl(var(--chart-4))",
    },
    maintenanceHours: {
      label: "Maintenance Hours",
      color: "hsl(var(--chart-5))",
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600 bg-green-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22.5°C</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3°C</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.6%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">2h 45m</span> downtime this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,340</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">-12%</span> vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Weekly Environmental Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Environmental Trends</CardTitle>
              <CardDescription>
                Temperature, humidity, and air quality over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="var(--color-temperature)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-temperature)" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="var(--color-humidity)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-humidity)" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="airQuality" 
                      stroke="var(--color-airQuality)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-airQuality)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Alert Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Frequency</CardTitle>
              <CardDescription>Number of alerts triggered each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="alerts" 
                      fill="var(--color-alerts)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {/* Monthly Maintenance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Maintenance Analysis</CardTitle>
              <CardDescription>
                Maintenance hours and system downtime over 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="maintenanceHours" 
                      stroke="var(--color-maintenanceHours)" 
                      fill="var(--color-maintenanceHours)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Environmental Averages */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Average Temperature</CardTitle>
                <CardDescription>Monthly temperature trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="avgTemp" 
                        stroke="var(--color-temperature)" 
                        strokeWidth={3}
                        dot={{ fill: "var(--color-temperature)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Humidity</CardTitle>
                <CardDescription>Monthly humidity trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="avgHumidity" 
                        stroke="var(--color-humidity)" 
                        strokeWidth={3}
                        dot={{ fill: "var(--color-humidity)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* System Health Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                System Health Distribution
              </CardTitle>
              <CardDescription>
                Overall system health status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-[300px] w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={systemHealth}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {systemHealth.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {systemHealth.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Predictive Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>
                AI-powered predictions and maintenance recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.title}</h4>
                      {getTrendIcon(insight.trend)}
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.prediction}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence:</span>
                        <span className="font-medium">{insight.confidence}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Timeframe:</span>
                        <span className="font-medium">{insight.timeframe}</span>
                      </div>
                      <div className="pt-2">
                        <Badge className={getTrendColor(insight.trend)}>
                          {insight.nextAction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { AnalyticsPanel };
