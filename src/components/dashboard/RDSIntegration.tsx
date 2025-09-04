import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, RotateCw, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useSensorData } from '@/hooks/useSensorData';
import { useToast } from '@/hooks/use-toast';

interface RDSIntegrationProps {
  className?: string;
}

export function RDSIntegration({ className }: RDSIntegrationProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const stored = localStorage.getItem('lastSyncTime');
    return stored ? new Date(stored) : null;
  });
  const { dashboardData, syncRDSData } = useSensorData();
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncRDSData();
      setSyncResult(result);
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now.toISOString());
      
      toast({
        title: "Sync Successful",
        description: `Synced ${result.synced_count} new records from AWS RDS`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed", 
        description: error instanceof Error ? error.message : "Failed to sync data from AWS RDS",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalReadings = dashboardData.reduce((sum, location) => sum + location.total_readings, 0);
  const avgAnomalyScore = dashboardData.length > 0 
    ? dashboardData.reduce((sum, location) => sum + location.avg_anomaly_score, 0) / dashboardData.length 
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              AWS RDS Integration
            </CardTitle>
            <CardDescription>
              Sync and process sensor data from your AWS RDS PostgreSQL database
            </CardDescription>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            size="sm"
            variant="outline"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">FDW Connection</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          {syncResult?.rds_info && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>RDS Records: {syncResult.rds_info.total_count?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Last Sync Status Card */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium">Synchronization Status</span>
          </div>
          
          {lastSyncTime ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Sync:</span>
                <span className="text-sm font-medium">
                  {lastSyncTime.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto-sync:</span>
                <Badge variant="secondary" className="text-xs">
                  Every 5 minutes
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No sync performed yet. Auto-sync runs every 5 minutes.
            </div>
          )}
          
          {syncResult && (
            <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-border">
              <div>
                <span className="text-muted-foreground">Records Synced:</span>
                <span className="ml-2 font-medium">{syncResult.synced_count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={syncResult.success ? "default" : "destructive"} className="ml-2">
                  {syncResult.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Local Data Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalReadings.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Processed</div>
          </div>
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-2xl font-bold text-primary">{dashboardData.length}</div>
            <div className="text-sm text-muted-foreground">Active Locations</div>
          </div>
          <div className="text-center p-3 bg-secondary/20 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {(avgAnomalyScore * 100).toFixed(3)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Anomaly Score</div>
          </div>
        </div>

        {/* Data Processing Pipeline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Data Processing Pipeline</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              AWS RDS (btiotdb)
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Supabase Processing
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              ML Analysis
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Dashboard UI
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-blue-900 dark:text-blue-100">Ready for ML Integration</span>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Your sensor data is now processed and ready for machine learning models. 
                Anomaly detection and predictive maintenance algorithms can be applied to the processed data.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}