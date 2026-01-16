import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, DoorOpen, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface DoorSecurityCardProps {
  doorStatus: "OPEN" | "CLOSED";
  doorOpens: number;
  intrusionAlert: boolean;
  lastUpdated?: string;
}

export const DoorSecurityCard = ({
  doorStatus,
  doorOpens,
  intrusionAlert,
  lastUpdated,
}: DoorSecurityCardProps) => {
  const [flashState, setFlashState] = useState(true);

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
        text: "Open",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/50",
        badgeVariant: "secondary" as const,
        iconBg: "bg-amber-500/20",
      };
    }
    
    return {
      icon: Shield,
      text: "Secure",
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
      "relative overflow-hidden transition-all duration-300",
      status.borderColor,
      intrusionAlert && "animate-pulse border-2"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Door Security
          </CardTitle>
          <Badge variant={status.badgeVariant} className={cn(
            intrusionAlert && flashState && "bg-red-600"
          )}>
            {status.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Status Display */}
        <div className={cn(
          "flex items-center justify-center py-6 rounded-lg transition-all duration-300",
          status.bgColor
        )}>
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "p-4 rounded-full transition-all duration-300",
              status.iconBg
            )}>
              <StatusIcon className={cn(
                "h-12 w-12 transition-all duration-300",
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

        {/* Entries Counter */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Entries Today</span>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {doorOpens}
          </span>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
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

export default DoorSecurityCard;
