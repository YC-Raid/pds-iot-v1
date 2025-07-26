
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  X, 
  Eye, 
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Zap
} from "lucide-react";

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: "High Humidity Detected",
      description: "Humidity levels have exceeded 70% in the center section",
      severity: "warning",
      type: "environmental",
      sensor: "Humidity Sensor #1",
      timestamp: "2024-01-15T14:30:00Z",
      status: "active",
      value: "75%",
      threshold: "70%",
      icon: Droplets
    },
    {
      id: 2,
      title: "Temperature Sensor Offline",
      description: "Temperature sensor in north wall has lost connection",
      severity: "critical",
      type: "system",
      sensor: "Temperature Sensor #2",
      timestamp: "2024-01-15T13:45:00Z",
      status: "active",
      value: "N/A",
      threshold: "N/A",
      icon: Thermometer
    },
    {
      id: 3,
      title: "Air Quality Improvement",
      description: "Air quality index has improved to excellent levels",
      severity: "info",
      type: "environmental",
      sensor: "Air Quality Monitor",
      timestamp: "2024-01-15T12:15:00Z",
      status: "resolved",
      value: "95 AQI",
      threshold: ">80 AQI",
      icon: Wind
    },
    {
      id: 4,
      title: "Power Consumption Spike",
      description: "Unusual power consumption detected in HVAC system",
      severity: "warning",
      type: "system",
      sensor: "Power Monitor",
      timestamp: "2024-01-15T11:20:00Z",
      status: "acknowledged",
      value: "2.5kW",
      threshold: "2.0kW",
      icon: Zap
    },
    {
      id: 5,
      title: "Maintenance Reminder",
      description: "Monthly sensor calibration is due tomorrow",
      severity: "info",
      type: "maintenance",
      sensor: "System",
      timestamp: "2024-01-15T09:00:00Z",
      status: "active",
      value: "Due: Jan 16",
      threshold: "Monthly",
      icon: Bell
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "info":
        return "text-blue-600 bg-blue-100 border-blue-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-red-600 bg-red-100";
      case "acknowledged":
        return "text-yellow-600 bg-yellow-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const acknowledgeAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: "acknowledged" }
        : alert
    ));
  };

  const resolveAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: "resolved" }
        : alert
    ));
  };

  const dismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const activeAlerts = alerts.filter(alert => alert.status === "active");
  const acknowledgedAlerts = alerts.filter(alert => alert.status === "acknowledged");
  const resolvedAlerts = alerts.filter(alert => alert.status === "resolved");

  const AlertCard = ({ alert }: { alert: typeof alerts[0] }) => {
    const IconComponent = alert.icon;
    
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{alert.title}</h4>
                <Badge className={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>📍 {alert.sensor}</span>
                <span>📊 {alert.value}</span>
                {alert.threshold !== "N/A" && <span>🎯 Threshold: {alert.threshold}</span>}
                <span>⏰ {formatTime(alert.timestamp)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getStatusColor(alert.status)}>
              {alert.status}
            </Badge>
          </div>
        </div>
        
        {alert.status === "active" && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => acknowledgeAlert(alert.id)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Acknowledge
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => resolveAlert(alert.id)}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Resolve
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => dismissAlert(alert.id)}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Eye className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{acknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Being addressed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12m</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Management
          </CardTitle>
          <CardDescription>
            Monitor and manage all system alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active ({activeAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="acknowledged" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Acknowledged ({acknowledgedAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved ({resolvedAlerts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeAlerts.length > 0 ? (
                activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">No active alerts</p>
              )}
            </TabsContent>

            <TabsContent value="acknowledged" className="space-y-4">
              {acknowledgedAlerts.length > 0 ? (
                acknowledgedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">No acknowledged alerts</p>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedAlerts.length > 0 ? (
                resolvedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">No resolved alerts today</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export { AlertsPanel };
