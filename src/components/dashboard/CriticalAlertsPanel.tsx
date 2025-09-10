import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MapPin, Thermometer, Droplets, Wind, Activity, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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

export function CriticalAlertsPanel() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  // Fetch real alerts from Supabase
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching alerts:', error);
          return;
        }

        if (data) {
          const transformedAlerts: CriticalAlert[] = data.map(alert => ({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity as 'critical' | 'high' | 'medium',
            sensor: alert.sensor || alert.sensor_type || 'Unknown',
            location: alert.location || 'Unknown',
            timestamp: new Date(alert.created_at),
            value: parseFloat(alert.value) || 0,
            unit: alert.unit || '',
            threshold: parseFloat(alert.threshold_value?.toString() || '0') || 0,
            status: alert.status as 'active' | 'acknowledged' | 'resolved'
          }));
          setAlerts(transformedAlerts);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchAlerts();
  }, []);

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