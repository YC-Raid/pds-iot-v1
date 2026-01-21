import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  DoorOpen, 
  DoorClosed,
  AlertTriangle, 
  Bell,
  Clock,
  History,
  ShieldAlert,
  CheckCircle2,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useDoorMetrics } from "@/hooks/useDoorMetrics";
import { supabase } from "@/integrations/supabase/client";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: "door_open" | "door_close" | "intrusion";
  details?: string;
}

interface SecurityAlertLog {
  id: string;
  alert_type: string;
  created_at: string;
  email_sent_at: string | null;
  recipient_email: string | null;
}

export const SecurityPanel = () => {
  const { sensorReadings } = useSensorData();
  const { calculateSecurityStatus, isNightMode, settings } = useSecuritySettings();
  const { totalEntriesToday, currentDoorStatus, doorOpenedAt: hookDoorOpenedAt, lastUpdated } = useDoorMetrics();
  const latestReading = sensorReadings[0];
  
  const [flashState, setFlashState] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertLog[]>([]);
  const [doorEvents, setDoorEvents] = useState<SecurityEvent[]>([]);
  const [doorOpenDuration, setDoorOpenDuration] = useState(0);

  // Use door status from real-time hook for faster updates
  const doorStatus = currentDoorStatus || "CLOSED";
  const doorOpenedAt = hookDoorOpenedAt;

  // Reset duration when door closes
  useEffect(() => {
    if (doorStatus !== "OPEN") {
      setDoorOpenDuration(0);
    }
  }, [doorStatus]);

  // Update door open duration every second
  useEffect(() => {
    if (doorStatus !== "OPEN" || !doorOpenedAt) return;

    // Calculate initial duration immediately
    const calculateDuration = () => {
      const now = new Date();
      const durationSeconds = Math.floor((now.getTime() - doorOpenedAt.getTime()) / 1000);
      setDoorOpenDuration(Math.max(0, durationSeconds));
    };
    
    calculateDuration();

    const interval = setInterval(calculateDuration, 1000);

    return () => clearInterval(interval);
  }, [doorStatus, doorOpenedAt]);

  // Calculate security status using frontend logic
  const securityStatus = useMemo(() => {
    return calculateSecurityStatus(doorStatus, doorOpenDuration);
  }, [doorStatus, doorOpenDuration, calculateSecurityStatus]);

  // Fetch security alerts
  useEffect(() => {
    const fetchSecurityAlerts = async () => {
      const { data, error } = await supabase
        .from("security_alert_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setSecurityAlerts(data);
      }
    };

    fetchSecurityAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("security-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_alert_log" },
        (payload) => {
          setSecurityAlerts((prev) => [payload.new as SecurityAlertLog, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Generate door events from sensor readings (last 1 hour only)
  useEffect(() => {
    const events: SecurityEvent[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    sensorReadings.slice(0, 100).forEach((reading, index) => {
      const recordedAt = new Date(reading.recorded_at);
      if (recordedAt < oneHourAgo) return; // Skip events older than 1 hour
      
      const prevReading = sensorReadings[index + 1];
      
      if (prevReading && reading.door_status !== prevReading.door_status) {
        if (reading.door_status === "OPEN") {
          events.push({
            id: `open-${reading.id}`,
            timestamp: reading.recorded_at,
            event_type: "door_open",
            details: "Main door opened",
          });
        } else if (reading.door_status === "CLOSED") {
          events.push({
            id: `close-${reading.id}`,
            timestamp: reading.recorded_at,
            event_type: "door_close",
            details: "Main door closed",
          });
        }
      }
    });

    setDoorEvents(events.slice(0, 20));
  }, [sensorReadings]);

  // Flashing effect for red alert
  useEffect(() => {
    if (!securityStatus.isRedAlert) {
      setFlashState(true);
      return;
    }
    
    const interval = setInterval(() => {
      setFlashState((prev) => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [securityStatus.isRedAlert]);

  const getSecurityStatusDisplay = () => {
    if (securityStatus.isRedAlert) {
      const isIntrusion = securityStatus.status === "intrusion";
      return {
        icon: ShieldAlert,
        text: isIntrusion ? "INTRUSION DETECTED" : "DOOR OPEN TOO LONG",
        subtext: isIntrusion 
          ? "Door opened during restricted hours" 
          : `Open for ${formatDuration(doorOpenDuration)}`,
        color: flashState ? "text-red-500" : "text-red-300",
        bgColor: flashState ? "bg-red-500/20" : "bg-red-500/10",
        borderColor: "border-red-500",
        badgeVariant: "destructive" as const,
        iconBg: flashState ? "bg-red-500/30" : "bg-red-500/10",
      };
    }
    
    if (securityStatus.isAmberWarning) {
      return {
        icon: DoorOpen,
        text: "Main Door Open",
        subtext: doorOpenDuration > 0 ? `Open for ${formatDuration(doorOpenDuration)}` : null,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/50",
        badgeVariant: "secondary" as const,
        iconBg: "bg-amber-500/20",
      };
    }
    
    return {
      icon: Shield,
      text: "System Secure",
      subtext: null,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/50",
      badgeVariant: "default" as const,
      iconBg: "bg-emerald-500/20",
    };
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const status = getSecurityStatusDisplay();
  const StatusIcon = status.icon;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "door_open":
        return <DoorOpen className="h-4 w-4 text-amber-500" />;
      case "door_close":
        return <DoorClosed className="h-4 w-4 text-emerald-500" />;
      case "intrusion":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case "intrusion":
        return { label: "Intrusion Alert", color: "text-red-500 bg-red-500/10" };
      case "door_open_too_long":
        return { label: "Door Open Warning", color: "text-amber-500 bg-amber-500/10" };
      default:
        return { label: alertType, color: "text-muted-foreground bg-muted" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Security Status - Top Banner */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        status.borderColor,
        securityStatus.isRedAlert && "animate-pulse border-2"
      )}>
        <CardContent className="py-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            {/* Main Status Display */}
            <div className="flex items-center gap-6">
              <div className={cn(
                "p-6 rounded-full transition-all duration-300",
                status.iconBg
              )}>
                <StatusIcon className={cn(
                  "h-16 w-16 transition-all duration-300",
                  status.color,
                  securityStatus.isRedAlert && "animate-bounce"
                )} />
              </div>
              <div>
                <h2 className={cn("text-3xl font-bold", status.color)}>
                  {status.text}
                </h2>
                {status.subtext && (
                  <p className={cn("text-lg mt-1", status.color)}>
                    {status.subtext}
                  </p>
                )}
                <p className="text-muted-foreground mt-1">
                  Last updated: {latestReading ? new Date(latestReading.recorded_at).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>

            {/* Quick Stats and Timer */}
            <div className="flex gap-8 items-center">
              {/* Door Open Timer */}
              {doorStatus === "OPEN" && (
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm">Open Duration</span>
                  </div>
                  <span className={cn(
                    "text-2xl font-mono font-bold",
                    doorOpenDuration >= settings.maxOpenDurationSeconds ? "text-red-500" : 
                    doorOpenDuration >= settings.maxOpenDurationSeconds * 0.8 ? "text-amber-500" : 
                    "text-foreground"
                  )}>
                    {formatDuration(doorOpenDuration)}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    Max: {formatDuration(settings.maxOpenDurationSeconds)}
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DoorOpen className="h-4 w-4" />
                  <span className="text-sm">Entries Today</span>
                </div>
                <span className="text-3xl font-bold text-foreground">{totalEntriesToday}</span>
              </div>
            </div>
          </div>

          {/* Night Mode Indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Badge variant={isNightMode() ? "destructive" : "secondary"}>
              {isNightMode() ? "Night Mode Active" : "Day Mode"}
            </Badge>
            <span className="text-muted-foreground">
              Restricted hours: {settings.nightModeStart} - {settings.nightModeEnd}
            </span>
          </div>

          {/* Red Alert Warning Banner */}
          {securityStatus.isRedAlert && (
            <div className={cn(
              "absolute inset-0 pointer-events-none border-4 rounded-lg transition-opacity duration-300",
              flashState ? "border-red-500 opacity-100" : "border-red-300 opacity-50"
            )} />
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <SecuritySettings />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Door Activity History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Door Activity History
            </CardTitle>
            <CardDescription>Recent door open/close events with timestamps</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {doorEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doorEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          <span className="capitalize">{event.event_type.replace("_", " ")}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {event.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500/50" />
                  <p>No door activity recorded</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Security Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Security Alerts
            </CardTitle>
            <CardDescription>Triggered security notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {securityAlerts.length > 0 ? (
                <div className="space-y-3">
                  {securityAlerts.map((alert) => {
                    const alertInfo = getAlertTypeLabel(alert.alert_type);
                    return (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className={cn("p-2 rounded-full", alertInfo.color)}>
                          {alert.alert_type === "intrusion" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <DoorOpen className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alertInfo.label}</span>
                            {alert.email_sent_at && (
                              <Badge variant="outline" className="text-xs">
                                Email Sent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                          {alert.recipient_email && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Sent to: {alert.recipient_email}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 text-emerald-500/50" />
                  <p>No security alerts triggered</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPanel;
