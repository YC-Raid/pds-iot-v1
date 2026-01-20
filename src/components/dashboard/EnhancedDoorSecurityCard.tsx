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
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSensorData } from "@/hooks/useSensorData";

interface DoorEvent {
  id: string;
  timestamp: string;
  event_type: "open" | "close";
}

export const EnhancedDoorSecurityCard = () => {
  const { sensorReadings } = useSensorData();
  const latestReading = sensorReadings[0];
  const [flashState, setFlashState] = useState(true);
  const [doorEvents, setDoorEvents] = useState<DoorEvent[]>([]);

  const doorStatus = (latestReading?.door_status as "OPEN" | "CLOSED") || "CLOSED";
  const doorOpens = latestReading?.door_opens || 0;
  const doorCloses = latestReading?.door_closes || 0;
  const intrusionAlert = latestReading?.intrusion_alert || false;

  // Generate door events from sensor readings
  useEffect(() => {
    const events: DoorEvent[] = [];
    
    sensorReadings.slice(0, 30).forEach((reading, index) => {
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

  // Flashing effect for intrusion alert
  useEffect(() => {
    if (!intrusionAlert) return;
    
    const interval = setInterval(() => {
      setFlashState((prev) => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [intrusionAlert]);

  const getSecurityStatus = () => {
    if (intrusionAlert) {
      return {
        icon: AlertTriangle,
        text: "INTRUSION DETECTED",
        color: flashState ? "text-red-500" : "text-red-300",
        bgColor: flashState ? "bg-red-500/20" : "bg-red-500/10",
        borderColor: "border-red-500",
        badgeVariant: "destructive" as const,
        iconBg: flashState ? "bg-red-500/30" : "bg-red-500/10",
      };
    }
    
    if (doorStatus === "OPEN") {
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

  const status = getSecurityStatus();
  const StatusIcon = status.icon;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 col-span-full",
      status.borderColor,
      intrusionAlert && "animate-pulse border-2"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-muted-foreground" />
            Door Security Monitor
          </CardTitle>
          <Badge variant={status.badgeVariant} className={cn(
            "text-sm px-3 py-1",
            intrusionAlert && flashState && "bg-red-600"
          )}>
            {status.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
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
                  intrusionAlert && "animate-bounce"
                )} />
              </div>
              <span className={cn(
                "text-xl font-bold tracking-wide",
                status.color
              )}>
                {status.text}
              </span>
            </div>
          </div>

          {/* Counters */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Entries Today
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600">Opens</span>
                </div>
                <span className="text-3xl font-bold text-amber-500">{doorOpens}</span>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600">Closes</span>
                </div>
                <span className="text-3xl font-bold text-emerald-500">{doorCloses}</span>
              </div>
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
        {latestReading?.recorded_at && (
          <div className="text-xs text-muted-foreground text-right mt-4">
            Last updated: {new Date(latestReading.recorded_at).toLocaleString()}
          </div>
        )}

        {/* Intrusion Warning Banner */}
        {intrusionAlert && (
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
