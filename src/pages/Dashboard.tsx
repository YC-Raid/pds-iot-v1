
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
import { Activity, Calendar, Bell, TrendingUp, Building, Waves, Timer, AlertTriangle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { JsonLd } from "@/components/seo/JsonLd";
import { useEffect } from "react";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';
  const pageMeta = {
    overview: { title: "Hangar Guardian — Overview", description: "Overview of IoT monitoring and predictive maintenance." },
    sensors: { title: "Hangar Guardian — Sensors", description: "Air quality, temperature, humidity, pressure, vibration sensors." },
    vibration: { title: "Hangar Guardian — Vibration Monitoring", description: "Real-time vibration analytics and thresholds." },
    longevity: { title: "Hangar Guardian — System Longevity", description: "Equipment lifespan projections and health scores." },
    maintenance: { title: "Hangar Guardian — Maintenance Schedule", description: "Upcoming maintenance dates and tasks." },
    alerts: { title: "Hangar Guardian — Alerts Center", description: "Live alerts, notifications, and critical warnings." },
    analytics: { title: "Hangar Guardian — Analytics", description: "Trends and insights across sensor data." },
    
  } as const;

  useEffect(() => {
    if (activeTab === 'settings') {
      navigate('/settings', { replace: true });
    }
  }, [activeTab, navigate]);

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
  ];

  return (
    <>
      <SEO title={pageMeta[activeTab as keyof typeof pageMeta]?.title || "Hangar Guardian Dashboard"} description={pageMeta[activeTab as keyof typeof pageMeta]?.description || "IoT monitoring, alerts, maintenance and analytics."} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Hangar Guardian",
        description: "IoT monitoring, alerts, maintenance and analytics dashboard",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: window.location.origin
      }} />
      {activeTab === 'alerts' && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Alerts Center",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Critical Alerts" },
            { "@type": "ListItem", position: 2, name: "Warnings" },
            { "@type": "ListItem", position: 3, name: "Notifications" }
          ]
        }} />
      )}
      {activeTab === 'maintenance' && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Maintenance Schedule",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Upcoming Maintenance" },
            { "@type": "ListItem", position: 2, name: "Overdue Tasks" }
          ]
        }} />
      )}
    <div className="min-h-screen bg-background p-6 animate-fade-in">
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
    </>
  );
};

export default Dashboard;
