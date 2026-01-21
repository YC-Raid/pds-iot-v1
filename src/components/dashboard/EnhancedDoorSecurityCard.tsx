import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  DoorOpen, 
  DoorClosed,
  AlertTriangle, 
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useDoorMetrics } from "@/hooks/useDoorMetrics";

interface DoorEvent {
  id: string;
  timestamp: string;
  event_type: "open" | "close";
}

export const EnhancedDoorSecurityCard = () => {
  const { sensorReadings } = useSensorData();
  const { calculateSecurityStatus, isNightMode, settings } = useSecuritySettings();
  const { totalEntriesToday, currentDoorStatus, doorOpenedAt, lastUpdated } = useDoorMetrics();
  
  const [flashState, setFlashState] = useState(true);
  const [doorEvents, setDoorEvents] = useState<DoorEvent[]>([]);
  const [doorOpenDuration, setDoorOpenDuration] = useState(0);

  // Use door status from real-time hook instead of sensorReadings for faster updates
  const doorStatus = currentDoorStatus || "CLOSED";

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

  // Generate door events from sensor readings (last 1 hour only)
  useEffect(() => {
    const events: DoorEvent[] = [];
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
            event_type: "open",
          });
        } else if (reading.door_status === "CLOSED") {
          events.push({
            id: `close-${reading.id}`,
            timestamp: reading.recorded_at,
            event_type: "close",
          });
        }
      }
    });

    setDoorEvents(events.slice(0, 10));
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getSecurityStatusDisplay = () => {
    if (securityStatus.isRedAlert) {
      const isIntrusion = securityStatus.status === "intrusion";
      return {
        icon: ShieldAlert,
        text: isIntrusion ? "INTRUSION DETECTED" : "DOOR OPEN TOO LONG",
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
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/50",
      badgeVariant: "default" as const,
      iconBg: "bg-emerald-500/20",
    };
  };

  const status = getSecurityStatusDisplay();
  const StatusIcon = status.icon;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 col-span-full",
      status.borderColor,
      securityStatus.isRedAlert && "animate-pulse border-2"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-muted-foreground" />
            Door Security Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isNightMode() ? "destructive" : "secondary"} className="text-xs">
              {isNightMode() ? "Night Mode" : "Day Mode"}
            </Badge>
            <Badge variant={status.badgeVariant} className={cn(
              "text-sm px-3 py-1",
              securityStatus.isRedAlert && flashState && "bg-red-600"
            )}>
              {status.text}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-4">
          {/* Status Display */}
          <div className={cn(
            "flex items-center justify-center py-8 rounded-lg transition-all duration-300",
            status.bgColor
          )}>
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "p-5 rounded-full transition-all duration-300",
                status.iconBg
              )}>
                <StatusIcon className={cn(
                  "h-14 w-14 transition-all duration-300",
                  status.color,
                  securityStatus.isRedAlert && "animate-bounce"
                )} />
              </div>
              <span className={cn(
                "text-xl font-bold tracking-wide text-center",
                status.color
              )}>
                {status.text}
              </span>
            </div>
          </div>

          {/* Duration Timer (visible when door is open) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Open Duration
            </h3>
            {doorStatus === "OPEN" ? (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className={cn(
                  "text-4xl font-mono font-bold text-center",
                  doorOpenDuration >= settings.maxOpenDurationSeconds ? "text-red-500" : 
                  doorOpenDuration >= settings.maxOpenDurationSeconds * 0.8 ? "text-amber-500" : 
                  "text-foreground"
                )}>
                  {formatDuration(doorOpenDuration)}
                </div>
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Alert at: {formatDuration(settings.maxOpenDurationSeconds)}
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      doorOpenDuration >= settings.maxOpenDurationSeconds ? "bg-red-500" : 
                      doorOpenDuration >= settings.maxOpenDurationSeconds * 0.8 ? "bg-amber-500" : 
                      "bg-emerald-500"
                    )}
                    style={{ 
                      width: `${Math.min((doorOpenDuration / settings.maxOpenDurationSeconds) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border h-[120px] flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Door is closed</span>
              </div>
            )}
          </div>

          {/* Entry Counter */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Entries Today
            </h3>
            <div className="p-6 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
              <DoorOpen className="h-8 w-8 text-primary mb-2" />
              <span className="text-5xl font-bold text-primary">{totalEntriesToday}</span>
              <span className="text-sm text-muted-foreground mt-1">Total entries</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </h3>
            <ScrollArea className="h-[140px]">
              {doorEvents.length > 0 ? (
                <div className="space-y-2">
                  {doorEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {event.event_type === "open" ? (
                          <DoorOpen className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <DoorClosed className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        <span className="capitalize">{event.event_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No activity recorded
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground text-right mt-4">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}

        {/* Red Alert Warning Banner */}
        {securityStatus.isRedAlert && (
          <div className={cn(
            "absolute inset-0 pointer-events-none border-4 rounded-lg transition-opacity duration-300",
            flashState ? "border-red-500 opacity-100" : "border-red-300 opacity-50"
          )} />
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDoorSecurityCard;
