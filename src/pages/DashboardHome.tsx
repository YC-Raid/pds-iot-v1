
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/dashboard/ImageGallery";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  Camera
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data for charts
const temperatureData = [
  { time: '00:00', value: 22.5 },
  { time: '04:00', value: 21.8 },
  { time: '08:00', value: 23.2 },
  { time: '12:00', value: 25.1 },
  { time: '16:00', value: 26.3 },
  { time: '20:00', value: 24.7 },
];

const humidityData = [
  { time: '00:00', value: 65 },
  { time: '04:00', value: 68 },
  { time: '08:00', value: 62 },
  { time: '12:00', value: 58 },
  { time: '16:00', value: 55 },
  { time: '20:00', value: 61 },
];

const airQualityData = [
  { time: '00:00', PM25: 12, PM10: 18, NO2: 25 },
  { time: '04:00', PM25: 10, PM10: 15, NO2: 22 },
  { time: '08:00', PM25: 15, PM10: 22, NO2: 30 },
  { time: '12:00', PM25: 18, PM10: 28, NO2: 35 },
  { time: '16:00', PM25: 14, PM10: 20, NO2: 28 },
  { time: '20:00', PM25: 11, PM10: 16, NO2: 24 },
];

const DashboardHome = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hangar Guardian Dashboard</h1>
            <p className="text-muted-foreground">Real-time IoT monitoring for aerospace storage facilities</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              All Systems Online
            </Badge>
            <Badge variant="outline">
              Last Updated: 30s ago
            </Badge>
          </div>
        </div>

        {/* Sensor Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative card-shadow card-hover">
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={48}
              inactiveZone={0.01}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.4°C</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-success mr-1" />
                +2.1% from yesterday
              </div>
              <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                Normal
              </Badge>
            </CardContent>
          </Card>

          <Card className="relative card-shadow card-hover">
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={48}
              inactiveZone={0.01}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">58%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-warning mr-1" />
                -1.2% from yesterday
              </div>
              <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                Optimal
              </Badge>
            </CardContent>
          </Card>

          <Card className="relative card-shadow card-hover">
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={48}
              inactiveZone={0.01}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Air Quality Index</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-success mr-1" />
                +0.8% from yesterday
              </div>
              <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                Good
              </Badge>
            </CardContent>
          </Card>

          <Card className="relative card-shadow card-hover">
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={48}
              inactiveZone={0.01}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.7%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-success mr-1" />
                All sensors active
              </div>
              <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                Operational
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="relative card-shadow">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />
            <CardHeader>
              <CardTitle>Temperature Trend (24h)</CardTitle>
              <CardDescription>Real-time temperature monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="relative card-shadow">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />
            <CardHeader>
              <CardTitle>Humidity Levels (24h)</CardTitle>
              <CardDescription>Humidity percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={humidityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--info))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Air Quality Chart */}
        <Card className="relative card-shadow">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <CardHeader>
            <CardTitle>Air Quality Metrics (24h)</CardTitle>
            <CardDescription>PM2.5, PM10, and NO2 levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={airQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="PM25" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  name="PM2.5 (μg/m³)"
                />
                <Line 
                  type="monotone" 
                  dataKey="PM10" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  name="PM10 (μg/m³)"
                />
                <Line 
                  type="monotone" 
                  dataKey="NO2" 
                  stroke="hsl(var(--info))" 
                  strokeWidth={2}
                  name="NO2 (ppb)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Image Gallery Section */}
        <Card className="relative card-shadow">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Facility Monitoring
            </CardTitle>
            <CardDescription>Recent images and videos from sensor locations</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGallery />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button className="bg-primary hover:bg-primary/90">
            <Settings className="w-4 h-4 mr-2" />
            Configure Alerts
          </Button>
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            View All Sensors
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
