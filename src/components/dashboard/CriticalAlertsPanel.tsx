import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Clock, MapPin, Thermometer, Droplets, Wind, Activity, CheckCircle, XCircle, Trash2, ArrowRight, CheckSquare, AlertCircle, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  status: 'active' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved';
}

export function CriticalAlertsPanel() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [alertCounts, setAlertCounts] = useState({
    active: 0,
    in_progress: 0,
    escalated: 0,
    total: 0
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved'>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Fetch alert counts and recent alerts from Supabase
  useEffect(() => {
    const fetchAlertsData = async () => {
      try {
        // Fetch counts for statistics
        const { data: countsData, error: countsError } = await supabase
          .from('alerts')
          .select('status')
          .not('status', 'eq', 'resolved');

        if (countsError) {
          console.error('Error fetching alert counts:', countsError);
          return;
        }

        // Calculate counts
        const counts = countsData?.reduce((acc, alert) => {
          acc.total++;
          if (alert.status === 'active') acc.active++;
          if (alert.status === 'in_progress') acc.in_progress++;
          if (alert.status === 'escalated') acc.escalated++;
          return acc;
        }, { active: 0, in_progress: 0, escalated: 0, total: 0 }) || { active: 0, in_progress: 0, escalated: 0, total: 0 };

        setAlertCounts(counts);

        // Fetch recent alerts for display (limited to 50 for performance)
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

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
            status: alert.status as 'active' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved'
          }));
          setAlerts(transformedAlerts);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchAlertsData();
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
      case 'in_progress':
        return 'default';
      case 'escalated':
        return 'destructive';
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
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'escalated':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const updateAlertStatus = async (alertIds: string[], newStatus: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: newStatus })
        .in('id', alertIds);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id) 
          ? { ...alert, status: newStatus as any }
          : alert
      ));

      toast({
        title: "Status Updated",
        description: `${alertIds.length} alert(s) updated to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update alert status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteAlerts = async (alertIds: string[]) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .in('id', alertIds);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => !alertIds.includes(alert.id)));
      setSelectedAlerts(new Set());

      toast({
        title: "Alerts Deleted",
        description: `${alertIds.length} alert(s) deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete alerts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAlert = (alertId: string, checked: boolean) => {
    const newSelected = new Set(selectedAlerts);
    if (checked) {
      newSelected.add(alertId);
    } else {
      newSelected.delete(alertId);
    }
    setSelectedAlerts(newSelected);
    setIsAllSelected(newSelected.size === filteredAlerts.length);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(new Set(filteredAlerts.map(alert => alert.id)));
    } else {
      setSelectedAlerts(new Set());
    }
    setIsAllSelected(checked);
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = ['active', 'acknowledged', 'in_progress', 'escalated', 'resolved'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const canProgressStatus = (status: string): boolean => {
    return getNextStatus(status) !== null;
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.status === filter
  );

  const activeAlertsCount = alertCounts.active;
  const selectedAlertsArray = Array.from(selectedAlerts);

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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {alertCounts.in_progress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alertCounts.escalated}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'active', 'acknowledged', 'in_progress', 'escalated', 'resolved'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === 'all' ? 'All Alerts' : status.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedAlerts.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedAlerts.size} alert(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const canProgress = selectedAlertsArray.some(id => {
                      const alert = alerts.find(a => a.id === id);
                      return alert && canProgressStatus(alert.status);
                    });
                    if (canProgress) {
                      const alertsToProgress = selectedAlertsArray.filter(id => {
                        const alert = alerts.find(a => a.id === id);
                        return alert && canProgressStatus(alert.status);
                      });
                      
                      // Group by next status and update
                      const statusGroups = new Map<string, string[]>();
                      alertsToProgress.forEach(id => {
                        const alert = alerts.find(a => a.id === id);
                        if (alert) {
                          const nextStatus = getNextStatus(alert.status);
                          if (nextStatus) {
                            if (!statusGroups.has(nextStatus)) {
                              statusGroups.set(nextStatus, []);
                            }
                            statusGroups.get(nextStatus)!.push(id);
                          }
                        }
                      });
                      
                      statusGroups.forEach((ids, status) => {
                        updateAlertStatus(ids, status);
                      });
                    }
                  }}
                  disabled={!selectedAlertsArray.some(id => {
                    const alert = alerts.find(a => a.id === id);
                    return alert && canProgressStatus(alert.status);
                  })}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Progress Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateAlertStatus(selectedAlertsArray, 'resolved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAlerts(selectedAlertsArray)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select All Checkbox */}
      {filteredAlerts.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({filteredAlerts.length} alerts)
          </label>
        </div>
      )}

      {/* Industrial Alert Management System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Industrial Alert Management System
          </CardTitle>
          <CardDescription>
            Comprehensive IIOT alert monitoring, investigation, and resolution tracking with bulk management capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedAlerts.has(alert.id)}
                        onCheckedChange={(checked) => handleSelectAlert(alert.id, !!checked)}
                        className="mt-1"
                      />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {getSensorIcon(alert.sensor)}
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription>{alert.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(alert.status)}
                      <Badge variant={getStatusColor(alert.status) as any}>
                        {alert.status.replace('_', ' ').toUpperCase()}
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
                  
                  <div className="flex gap-2">
                    {canProgressStatus(alert.status) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const nextStatus = getNextStatus(alert.status);
                          if (nextStatus) {
                            updateAlertStatus([alert.id], nextStatus);
                          }
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {getNextStatus(alert.status)?.replace('_', ' ')}
                      </Button>
                    )}
                    
                    {alert.status !== 'resolved' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateAlertStatus([alert.id], 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteAlerts([alert.id])}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} alerts found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}