import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MapPin, Thermometer, Droplets, Wind, Activity, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface CriticalAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  sensor: string;
  location: string;
  timestamp: Date;
  value: number;
  unit: string;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
}

const mockCriticalAlerts: CriticalAlert[] = [
  {
    id: '1',
    title: 'Temperature Critical Threshold Exceeded',
    description: 'Storage area temperature has exceeded safe operating limits',
    severity: 'critical',
    sensor: 'Temperature',
    location: 'Storage Zone A',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    value: 45.2,
    unit: '°C',
    threshold: 40,
    status: 'active'
  },
  {
    id: '2',
    title: 'Vibration Anomaly Detected',
    description: 'Unusual vibration patterns detected in equipment',
    severity: 'high',
    sensor: 'Vibration',
    location: 'Equipment Bay 2',
    timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    value: 8.7,
    unit: 'mm/s',
    threshold: 5.0,
    status: 'acknowledged'
  },
  {
    id: '3',
    title: 'Humidity Level Warning',
    description: 'Humidity levels approaching critical threshold',
    severity: 'medium',
    sensor: 'Humidity',
    location: 'Storage Zone B',
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    value: 78.5,
    unit: '%',
    threshold: 80,
    status: 'resolved'
  },
  {
    id: '4',
    title: 'Air Quality Degradation',
    description: 'Air quality index indicates poor conditions',
    severity: 'high',
    sensor: 'Air Quality',
    location: 'Main Storage',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    value: 185,
    unit: 'AQI',
    threshold: 150,
    status: 'active'
  }
];

export function CriticalAlertsPanel() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>(mockCriticalAlerts);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getSensorIcon = (sensor: string) => {
    switch (sensor.toLowerCase()) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Droplets className="h-4 w-4" />;
      case 'air quality':
        return <Wind className="h-4 w-4" />;
      case 'vibration':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'acknowledged':
        return <Clock className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const }
        : alert
    ));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.status === filter
  );

  const activeAlertsCount = alerts.filter(alert => alert.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeAlertsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">
              {alerts.filter(a => a.status === 'acknowledged').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {alerts.filter(a => a.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'active', 'acknowledged', 'resolved'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === 'all' ? 'All Alerts' : status}
          </Button>
        ))}
      </div>

      {/* Critical Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getSensorIcon(alert.sensor)}
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{alert.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(alert.status)}
                  <Badge variant={getStatusColor(alert.status) as any}>
                    {alert.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Value</div>
                  <div className="font-semibold">{alert.value} {alert.unit}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Threshold</div>
                  <div className="font-semibold">{alert.threshold} {alert.unit}</div>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-semibold">{alert.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="font-semibold">{format(alert.timestamp, 'HH:mm:ss')}</div>
                  </div>
                </div>
              </div>
              
              {alert.status === 'active' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleResolve(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              )}
              
              {alert.status === 'acknowledged' && (
                <Button 
                  size="sm" 
                  onClick={() => handleResolve(alert.id)}
                >
                  Resolve
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} alerts found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}