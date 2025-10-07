import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Archive, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RetentionStats {
  raw_0_7_days: number;
  raw_8_30_days: number;
  raw_31_90_days: number;
  raw_90_plus_days: number;
  hourly_aggregations: number;
  daily_aggregations: number;
  weekly_aggregations: number;
  monthly_aggregations: number;
  total_raw: number;
  total_aggregated: number;
}

export default function DataRetentionMonitor() {
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Get raw data counts by age
      const [raw0_7, raw8_30, raw31_90, raw90plus, totalRaw] = await Promise.all([
        supabase.from('processed_sensor_readings').select('id', { count: 'exact', head: true })
          .gte('recorded_at', sevenDaysAgo.toISOString()),
        supabase.from('processed_sensor_readings').select('id', { count: 'exact', head: true })
          .lt('recorded_at', sevenDaysAgo.toISOString())
          .gte('recorded_at', thirtyDaysAgo.toISOString()),
        supabase.from('processed_sensor_readings').select('id', { count: 'exact', head: true })
          .lt('recorded_at', thirtyDaysAgo.toISOString())
          .gte('recorded_at', ninetyDaysAgo.toISOString()),
        supabase.from('processed_sensor_readings').select('id', { count: 'exact', head: true })
          .lt('recorded_at', ninetyDaysAgo.toISOString()),
        supabase.from('processed_sensor_readings').select('id', { count: 'exact', head: true })
      ]);

      // Get aggregation counts by level
      const [hourly, daily, weekly, monthly, totalAgg] = await Promise.all([
        supabase.from('sensor_readings_aggregated').select('id', { count: 'exact', head: true })
          .eq('aggregation_level', 'hour'),
        supabase.from('sensor_readings_aggregated').select('id', { count: 'exact', head: true })
          .eq('aggregation_level', 'day'),
        supabase.from('sensor_readings_aggregated').select('id', { count: 'exact', head: true })
          .eq('aggregation_level', 'week'),
        supabase.from('sensor_readings_aggregated').select('id', { count: 'exact', head: true })
          .eq('aggregation_level', 'month'),
        supabase.from('sensor_readings_aggregated').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        raw_0_7_days: raw0_7.count || 0,
        raw_8_30_days: raw8_30.count || 0,
        raw_31_90_days: raw31_90.count || 0,
        raw_90_plus_days: raw90plus.count || 0,
        hourly_aggregations: hourly.count || 0,
        daily_aggregations: daily.count || 0,
        weekly_aggregations: weekly.count || 0,
        monthly_aggregations: monthly.count || 0,
        total_raw: totalRaw.count || 0,
        total_aggregated: totalAgg.count || 0,
      });
    } catch (error) {
      console.error('Error fetching retention stats:', error);
      toast.error('Failed to load retention statistics');
    } finally {
      setLoading(false);
    }
  };

  const triggerArchiving = async () => {
    setArchiving(true);
    try {
      const { data, error } = await supabase.functions.invoke('archive-sensor-data');
      
      if (error) throw error;
      
      toast.success('Archiving process completed', {
        description: `Deleted ${data.summary?.deleted_raw_readings || 0} raw readings`
      });
      
      // Refresh stats after archiving
      await fetchStats();
    } catch (error: any) {
      console.error('Error triggering archiving:', error);
      toast.error('Failed to trigger archiving', {
        description: error.message
      });
    } finally {
      setArchiving(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Data Retention Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading statistics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Data Retention Monitor
            </CardTitle>
            <CardDescription>
              Hybrid archiving strategy (Strategy 4) - Scheduled daily at 12:00 AM SGT
            </CardDescription>
          </div>
          <Button onClick={triggerArchiving} disabled={archiving} variant="outline">
            {archiving ? 'Archiving...' : 'Run Now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Raw Data Retention */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Raw Sensor Data</h3>
            <Badge variant="secondary">{stats?.total_raw.toLocaleString()} total</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">0-7 Days</div>
              <div className="text-2xl font-bold">{stats?.raw_0_7_days.toLocaleString()}</div>
              <div className="text-xs text-green-600">✓ All raw data kept</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">8-30 Days</div>
              <div className="text-2xl font-bold">{stats?.raw_8_30_days.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Raw + hourly agg</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">31-90 Days</div>
              <div className="text-2xl font-bold">{stats?.raw_31_90_days.toLocaleString()}</div>
              <div className="text-xs text-orange-600">Should be deleted</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">90+ Days</div>
              <div className="text-2xl font-bold">{stats?.raw_90_plus_days.toLocaleString()}</div>
              <div className="text-xs text-red-600">Should be deleted</div>
            </div>
          </div>
        </div>

        {/* Aggregated Data */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Aggregated Data</h3>
            <Badge variant="secondary">{stats?.total_aggregated.toLocaleString()} total</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">Hourly</div>
              <div className="text-2xl font-bold">{stats?.hourly_aggregations.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">8-90 days</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">Daily</div>
              <div className="text-2xl font-bold">{stats?.daily_aggregations.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">91+ days</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">Weekly</div>
              <div className="text-2xl font-bold">{stats?.weekly_aggregations.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">91+ days</div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <div className="text-xs text-muted-foreground">Monthly</div>
              <div className="text-2xl font-bold">{stats?.monthly_aggregations.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">91+ days</div>
            </div>
          </div>
        </div>

        {/* Strategy Info */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">Retention Strategy</span>
          </div>
          <ul className="space-y-1 text-muted-foreground ml-6 list-disc">
            <li>0-7 days: Keep all raw readings</li>
            <li>8-30 days: Keep raw + ensure hourly aggregations exist</li>
            <li>31-90 days: Delete raw, keep hourly aggregations</li>
            <li>91+ days: Keep only daily/weekly/monthly aggregations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
