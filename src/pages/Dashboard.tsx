
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SensorOverview } from "@/components/dashboard/SensorOverview";
import { MaintenanceCalendar } from "@/components/dashboard/MaintenanceCalendar";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { CriticalAlertsPanel } from "@/components/dashboard/CriticalAlertsPanel";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { HangarStatus } from "@/components/dashboard/HangarStatus";
import CriticalAlertsOverview from "@/components/dashboard/CriticalAlertsOverview";
import { VibrationMonitoring } from "@/components/dashboard/VibrationMonitoring";
import { SystemLongevity } from "@/components/dashboard/SystemLongevity";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { DataExport } from "@/components/ui/data-export";
import { Activity, Calendar, Bell, TrendingUp, Building, Waves, Timer, Settings, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';
  const tabs = [
    {
      title: "Overview",
      value: "overview",
      icon: <Building className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <CriticalAlertsOverview />
          <HangarStatus />
        </div>
      ),
    },
    {
      title: "Sensors",
      value: "sensors",
      icon: <Activity className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <SensorOverview />
        </div>
      ),
    },
    {
      title: "Vibration",
      value: "vibration",
      icon: <Waves className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <VibrationMonitoring />
        </div>
      ),
    },
    {
      title: "Longevity",
      value: "longevity",
      icon: <Timer className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <SystemLongevity />
        </div>
      ),
    },
    {
      title: "Maintenance",
      value: "maintenance",
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <MaintenanceCalendar />
        </div>
      ),
    },
    {
      title: "Alerts",
      value: "alerts",
      icon: <Bell className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <AlertsPanel />
        </div>
      ),
    },
    {
      title: "Analytics",
      value: "analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <AnalyticsPanel />
        </div>
      ),
    },
    {
      title: "Settings",
      value: "settings",
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card className="relative">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure your IoT monitoring system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="relative">
                    <GlowingEffect
                      spread={30}
                      glow={true}
                      disabled={false}
                      proximity={48}
                      inactiveZone={0.01}
                    />
                    <CardHeader>
                      <CardTitle className="text-lg">Sensor Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Manage sensor thresholds and calibration settings.</p>
                    </CardContent>
                  </Card>
                  <Card className="relative">
                    <GlowingEffect
                      spread={30}
                      glow={true}
                      disabled={false}
                      proximity={48}
                      inactiveZone={0.01}
                    />
                    <CardHeader>
                      <CardTitle className="text-lg">Alert Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Configure notification preferences and alert rules.</p>
                    </CardContent>
                  </Card>
                  <Card className="relative">
                    <GlowingEffect
                      spread={30}
                      glow={true}
                      disabled={false}
                      proximity={48}
                      inactiveZone={0.01}
                    />
                    <CardHeader>
                      <CardTitle className="text-lg">Data Retention</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Set data storage and backup policies.</p>
                    </CardContent>
                  </Card>
                  <Card className="relative">
                    <GlowingEffect
                      spread={30}
                      glow={true}
                      disabled={false}
                      proximity={48}
                      inactiveZone={0.01}
                    />
                    <CardHeader>
                      <CardTitle className="text-lg">User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Manage user accounts and permissions.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hangar Guardian</h1>
            <p className="text-muted-foreground">IoT Monitoring & Predictive Maintenance System</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              System Online
            </Badge>
            <Badge variant="outline">
              Last Updated: 2 min ago
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              🔒 Login Required for Full Access
            </Badge>
          </div>
        </div>

        {/* Animated Dashboard Tabs */}
        <div className="space-y-6">
          <AnimatedTabs 
            tabs={tabs}
            defaultValue={activeTab}
            containerClassName="grid w-full grid-cols-8 bg-muted p-1 rounded-lg"
            tabClassName="text-sm font-medium transition-all duration-200"
            activeTabClassName="bg-background shadow-sm"
            contentClassName="min-h-[600px]"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
