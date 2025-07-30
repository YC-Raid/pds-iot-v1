import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Clock,
  X
} from "lucide-react";

export type NotificationStatus = 'critical' | 'warning' | 'info' | 'status';

interface Notification {
  id: string;
  title: string;
  message: string;
  status: NotificationStatus;
  timestamp: string;
  acknowledged?: boolean;
  actionRequired?: boolean;
}

interface NotificationStatusProps {
  notifications: Notification[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function NotificationStatus({ 
  notifications, 
  onAcknowledge, 
  onDismiss,
  onViewDetails 
}: NotificationStatusProps) {
  
  const getStatusConfig = (status: NotificationStatus) => {
    switch (status) {
      case 'critical':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'destructive',
          bgColor: 'bg-destructive/10 border-destructive/20',
          textColor: 'text-destructive'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'default',
          bgColor: 'bg-warning/10 border-warning/20',
          textColor: 'text-warning'
        };
      case 'info':
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'secondary',
          bgColor: 'bg-info/10 border-info/20',
          textColor: 'text-info'
        };
      case 'status':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'outline',
          bgColor: 'bg-muted/50 border-muted',
          textColor: 'text-muted-foreground'
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'secondary',
          bgColor: 'bg-muted/50 border-muted',
          textColor: 'text-muted-foreground'
        };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.status]) {
      acc[notification.status] = [];
    }
    acc[notification.status].push(notification);
    return acc;
  }, {} as Record<NotificationStatus, Notification[]>);

  const statusOrder: NotificationStatus[] = ['critical', 'warning', 'info', 'status'];

  return (
    <div className="space-y-4">
      {statusOrder.map(status => {
        const statusNotifications = groupedNotifications[status] || [];
        if (statusNotifications.length === 0) return null;

        const config = getStatusConfig(status);

        return (
          <Card key={status} className={`relative ${config.bgColor}`}>
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={48}
              inactiveZone={0.01}
            />
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg flex items-center gap-2 ${config.textColor}`}>
                {config.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)} Notifications
                <Badge variant={config.color as any} className="ml-auto">
                  {statusNotifications.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between p-3 bg-background/50 rounded-lg border"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 ${config.textColor}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                          {notification.acknowledged && (
                            <Badge variant="outline" className="text-xs">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {notification.actionRequired && !notification.acknowledged && onAcknowledge && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcknowledge(notification.id)}
                        className="text-xs h-7"
                      >
                        Acknowledge
                      </Button>
                    )}
                    
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(notification.id)}
                        className="text-xs h-7"
                      >
                        View
                      </Button>
                    )}
                    
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(notification.id)}
                        className="text-xs h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      
      {notifications.length === 0 && (
        <Card className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-muted-foreground">All notifications cleared</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}