import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertOctagon, Clock, CheckCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  priority: string;
  sensor_type: string;
  location: string;
  value: string;
  threshold: string;
  unit: string;
  impact: string;
  created_at: string;
}

const CriticalAlertsOverview = () => {
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCriticalAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .in('priority', ['P1', 'P2'])
          .in('status', ['active', 'acknowledged'])
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching critical alerts:', error);
          return;
        }

        setCriticalAlerts(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCriticalAlerts();

    // Set up real-time subscription for alerts
    const channel = supabase
      .channel('critical-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: 'priority=in.(P1,P2)'
        },
        () => {
          fetchCriticalAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityIcon = (priority: string) => {
    switch (priority) {
      case 'P1':
        return <AlertOctagon className="h-4 w-4 text-destructive" />;
      case 'P2':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSeverityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return "text-destructive bg-destructive/10 border-destructive/20";
      case 'P2':
        return "text-orange-600 bg-orange-100 border-orange-200";
      default:
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-destructive bg-destructive/10";
      case "acknowledged":
        return "text-yellow-600 bg-yellow-100";
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-muted-foreground bg-muted/50";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-destructive" />
            Critical Alerts
          </CardTitle>
          <CardDescription>
            High priority alerts requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-md"></div>
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
            <AlertOctagon className="h-5 w-5 text-destructive" />
            <CardTitle>Critical Alerts</CardTitle>
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalAlerts.length}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/?tab=alerts')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
        <CardDescription>
          High priority alerts requiring immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {criticalAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">All Clear</h3>
            <p className="text-sm text-muted-foreground">
              No critical alerts at this time. System operating normally.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/?tab=alerts`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getSeverityColor(alert.priority)}>
                          {alert.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1 truncate">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {alert.description}
                      </p>
                      {alert.impact && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 mb-2">
                          <strong>Impact:</strong> {alert.impact.substring(0, 100)}
                          {alert.impact.length > 100 && '...'}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(alert.created_at)}
                        </span>
                        <span>{alert.location}</span>
                        <span>
                          {alert.value} {alert.unit} (Threshold: {alert.threshold} {alert.unit})
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
};

export default CriticalAlertsOverview;