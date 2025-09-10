import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, Thermometer, Droplets, Gauge, Wind, Brain, TrendingDown, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  sensor_type: string;
  location: string;
  value: string;
  threshold: string;
  unit: string;
  created_at: string;
  status: string;
}

export function AnomalyAlertsPanel() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  const fetchAnomalyAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('category', 'sensor_anomaly')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching anomaly alerts:', error);
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnomalyDetection = async () => {
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-anomalies');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Anomaly Detection Complete",
        description: `Processed ${data.processed_readings} readings, generated ${data.alerts_generated} alerts`,
      });

      // Refresh alerts after detection
      fetchAnomalyAlerts();
    } catch (error) {
      console.error('Error running anomaly detection:', error);
      toast({
        title: "Anomaly Detection Failed",
        description: "Failed to run anomaly detection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    fetchAnomalyAlerts();

    // Set up real-time subscription for anomaly alerts
    const channel = supabase
      .channel('anomaly-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: 'category=eq.sensor_anomaly'
        },
        () => {
          fetchAnomalyAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Droplets className="h-4 w-4" />;
      case 'pressure':
        return <Gauge className="h-4 w-4" />;
      case 'air_quality':
        return <Wind className="h-4 w-4" />;
      case 'anomaly':
        return <Brain className="h-4 w-4" />;
      case 'failure_prediction':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSensorTypeLabel = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature':
        return 'Temperature';
      case 'humidity':
        return 'Humidity';
      case 'pressure':
        return 'Pressure';
      case 'air_quality':
        return 'Air Quality';
      case 'anomaly':
        return 'Anomaly Detection';
      case 'failure_prediction':
        return 'Failure Prediction';
      default:
        return sensorType;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Sensor Anomaly Alerts
          </CardTitle>
          <CardDescription>
            Real-time anomaly detection from all sensor readings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-md"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Sensor Anomaly Alerts</CardTitle>
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.filter(a => a.status === 'active').length}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={runAnomalyDetection}
            disabled={detecting}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? 'Detecting...' : 'Run Detection'}
          </Button>
        </div>
        <CardDescription>
          Real-time anomaly detection from all sensor readings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Anomalies Detected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              All sensors are operating within normal parameters.
            </p>
            <Button variant="outline" onClick={runAnomalyDetection} disabled={detecting}>
              <RefreshCw className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
              Check for Anomalies
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSensorIcon(alert.sensor_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {getSensorTypeLabel(alert.sensor_type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.location}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          <strong>Current:</strong> {alert.value} {alert.unit}
                        </span>
                        <span>
                          <strong>Threshold:</strong> {alert.threshold} {alert.unit}
                        </span>
                        <span>
                          {format(new Date(alert.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}