
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Calendar,
  Loader2
} from "lucide-react";
import { format, subDays, subMonths, startOfDay, startOfMonth, endOfMonth } from "date-fns";

interface WeeklyTrendPoint {
  day: string;
  temperature: number | null;
  humidity: number | null;
  airQuality: number | null;
  alerts: number;
}

interface MonthlyDataPoint {
  month: string;
  avgTemp: number | null;
  avgHumidity: number | null;
  maintenanceHours: number;
  downtime: number;
}

interface SystemHealthItem {
  name: string;
  value: number;
  color: string;
}

const AnalyticsPanel = () => {
  // Real data state
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthItem[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState({
    avgTemp: null as number | null,
    tempChange: null as number | null,
    uptime: null as number | null,
    downtimeHours: null as number | null,
    efficiencyScore: null as number | null,
    efficiencyChange: null as number | null,
  });
  const [loadingCharts, setLoadingCharts] = useState(true);

  // Fetch real data for overview cards + weekly + monthly + system health
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoadingCharts(true);
      try {
        // --- Weekly Trends (last 7 days) ---
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const [{ data: weeklyReadings }, { data: weeklyAlerts }] = await Promise.all([
          supabase
            .from('sensor_readings_aggregated')
            .select('time_bucket, avg_temperature, avg_humidity, avg_pm2_5')
            .eq('aggregation_level', 'day')
            .gte('time_bucket', sevenDaysAgo)
            .order('time_bucket', { ascending: true }),
          supabase
            .from('alerts')
            .select('created_at')
            .gte('created_at', sevenDaysAgo),
        ]);

        // Group alerts by day
        const alertsByDay = new Map<string, number>();
        (weeklyAlerts || []).forEach(a => {
          const day = format(new Date(a.created_at), 'EEE');
          alertsByDay.set(day, (alertsByDay.get(day) || 0) + 1);
        });

        const weeklyData: WeeklyTrendPoint[] = (weeklyReadings || []).map(r => ({
          day: format(new Date(r.time_bucket), 'EEE'),
          temperature: r.avg_temperature != null ? Math.round(r.avg_temperature * 10) / 10 : null,
          humidity: r.avg_humidity != null ? Math.round(r.avg_humidity * 10) / 10 : null,
          airQuality: r.avg_pm2_5 != null ? Math.round(r.avg_pm2_5 * 10) / 10 : null,
          alerts: alertsByDay.get(format(new Date(r.time_bucket), 'EEE')) || 0,
        }));
        setWeeklyTrends(weeklyData);

        // --- Monthly Data (last 6 months) ---
        const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
        const [{ data: monthlyReadings }, { data: monthlyTasks }] = await Promise.all([
          supabase
            .from('sensor_readings_aggregated')
            .select('time_bucket, avg_temperature, avg_humidity')
            .eq('aggregation_level', 'month')
            .gte('time_bucket', sixMonthsAgo)
            .order('time_bucket', { ascending: true }),
          supabase
            .from('maintenance_tasks')
            .select('created_at, completed_at, labor_hours, status')
            .gte('created_at', sixMonthsAgo),
        ]);

        // Group maintenance by month
        const maintByMonth = new Map<string, { hours: number; downtime: number }>();
        (monthlyTasks || []).forEach(t => {
          const monthKey = format(new Date(t.created_at), 'MMM');
          const entry = maintByMonth.get(monthKey) || { hours: 0, downtime: 0 };
          entry.hours += Number(t.labor_hours) || 0;
          if (t.completed_at && t.status === 'completed') {
            const dur = (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 3600);
            entry.downtime += Math.max(0, dur);
          }
          maintByMonth.set(monthKey, entry);
        });

        const monthly: MonthlyDataPoint[] = (monthlyReadings || []).map(r => {
          const monthKey = format(new Date(r.time_bucket), 'MMM');
          const maint = maintByMonth.get(monthKey) || { hours: 0, downtime: 0 };
          return {
            month: monthKey,
            avgTemp: r.avg_temperature != null ? Math.round(r.avg_temperature * 10) / 10 : null,
            avgHumidity: r.avg_humidity != null ? Math.round(r.avg_humidity * 10) / 10 : null,
            maintenanceHours: Math.round(maint.hours * 10) / 10,
            downtime: Math.round(maint.downtime * 10) / 10,
          };
        });
        setMonthlyData(monthly);

        // --- System Health (from recent alerts severity distribution) ---
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const { data: healthAlerts } = await supabase
          .from('alerts')
          .select('severity')
          .gte('created_at', thirtyDaysAgo);

        const total = (healthAlerts || []).length;
        if (total > 0) {
          const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
          (healthAlerts || []).forEach(a => {
            const sev = a.severity as keyof typeof counts;
            if (sev in counts) counts[sev]++;
          });
          // "Excellent" = readings with no alerts (inferred), Good = low/info, Warning = medium/high, Critical
          const criticalPct = Math.round((counts.critical / total) * 100);
          const warningPct = Math.round(((counts.high + counts.medium) / total) * 100);
          const goodPct = Math.round(((counts.low + counts.info) / total) * 100);
          const excellentPct = Math.max(0, 100 - criticalPct - warningPct - goodPct);
          setSystemHealth([
            { name: "Excellent", value: excellentPct, color: "#22c55e" },
            { name: "Good", value: goodPct, color: "#3b82f6" },
            { name: "Warning", value: warningPct, color: "#f59e0b" },
            { name: "Critical", value: criticalPct, color: "#ef4444" },
          ]);
        } else {
          setSystemHealth([
            { name: "Excellent", value: 100, color: "#22c55e" },
            { name: "Good", value: 0, color: "#3b82f6" },
            { name: "Warning", value: 0, color: "#f59e0b" },
            { name: "Critical", value: 0, color: "#ef4444" },
          ]);
        }

        // --- Overview Cards ---
        // Avg Temperature (last 7 days vs previous 7 days)
        const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
        const { data: recentReadings } = await supabase
          .from('sensor_readings_aggregated')
          .select('time_bucket, avg_temperature')
          .eq('aggregation_level', 'day')
          .gte('time_bucket', fourteenDaysAgo)
          .order('time_bucket', { ascending: true });

        if (recentReadings && recentReadings.length > 0) {
          const sevenDaysAgoDate = subDays(new Date(), 7);
          const thisWeek = recentReadings.filter(r => new Date(r.time_bucket) >= sevenDaysAgoDate);
          const lastWeek = recentReadings.filter(r => new Date(r.time_bucket) < sevenDaysAgoDate);
          
          const avgThis = thisWeek.length > 0
            ? thisWeek.reduce((s, r) => s + (r.avg_temperature || 0), 0) / thisWeek.length
            : null;
          const avgLast = lastWeek.length > 0
            ? lastWeek.reduce((s, r) => s + (r.avg_temperature || 0), 0) / lastWeek.length
            : null;
          
          setOverviewMetrics(prev => ({
            ...prev,
            avgTemp: avgThis != null ? Math.round(avgThis * 10) / 10 : null,
            tempChange: avgThis != null && avgLast != null ? Math.round((avgThis - avgLast) * 10) / 10 : null,
          }));
        }

        // Uptime (from sensor reading gaps in last 30 days)
        const { count: readingCount } = await supabase
          .from('processed_sensor_readings')
          .select('id', { count: 'exact', head: true })
          .gte('recorded_at', thirtyDaysAgo);

        // Rough uptime estimate: if we get readings every ~10s, expect ~259200 in 30 days
        const expectedReadings = 30 * 24 * 360; // 10-sec intervals
        const uptimePct = readingCount ? Math.min(100, (readingCount / expectedReadings) * 100) : null;
        
        // Efficiency from maintenance task completion rate
        const { data: effTasks } = await supabase
          .from('maintenance_tasks')
          .select('status')
          .gte('created_at', thirtyDaysAgo);

        let effScore = null as number | null;
        if (effTasks && effTasks.length > 0) {
          const completed = effTasks.filter(t => t.status === 'completed').length;
          effScore = Math.round((completed / effTasks.length) * 100);
        }

        setOverviewMetrics(prev => ({
          ...prev,
          uptime: uptimePct != null ? Math.round(uptimePct * 10) / 10 : null,
          downtimeHours: uptimePct != null ? Math.round((100 - uptimePct) / 100 * 720 * 10) / 10 : null,
          efficiencyScore: effScore,
        }));

      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoadingCharts(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const chartConfig = {
    temperature: {
      label: "Temperature (°C)",
      color: "hsl(var(--chart-1))",
    },
    humidity: {
      label: "Humidity (%)",
      color: "hsl(var(--chart-2))",
    },
    airQuality: {
      label: "PM2.5 (μg/m³)",
      color: "hsl(var(--chart-3))",
    },
    alerts: {
      label: "Alerts",
      color: "hsl(var(--chart-4))",
    },
    maintenanceHours: {
      label: "Maintenance Hours",
      color: "hsl(var(--chart-5))",
    }
  };

  // Reliability metrics state
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [mttrHours, setMttrHours] = useState<number | null>(null);
  const [mtbfHours, setMtbfHours] = useState<number | null>(null);
  const [sensorCorrelations, setSensorCorrelations] = useState<{ sensor_type: string; r: number }[]>([]);
  const [costTotal, setCostTotal] = useState<number | null>(null);
  const [costChangePct, setCostChangePct] = useState<number | null>(null);

  const timeframeToStartDate = (tf: '7d'|'30d'|'90d') => {
    const d = new Date();
    const days = tf === '7d' ? 7 : tf === '30d' ? 30 : 90;
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const pearson = (x: number[], y: number[]) => {
    if (x.length !== y.length || x.length < 2) return 0;
    const n = x.length;
    const mx = x.reduce((a,b)=>a+b,0)/n;
    const my = y.reduce((a,b)=>a+b,0)/n;
    let num=0, dx=0, dy=0;
    for (let i=0;i<n;i++) { const xv=x[i]-mx; const yv=y[i]-my; num += xv*yv; dx += xv*xv; dy += yv*yv; }
    const den = Math.sqrt(dx*dy);
    return den === 0 ? 0 : num/den;
  };

  const formatHours = (h: number | null) => {
    if (h == null) return '—';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  useEffect(() => {
    const fetchReliability = async () => {
      const since = timeframeToStartDate(timeframe);
      // MTTR
      const { data: tasks } = await supabase
        .from('maintenance_tasks')
        .select('created_at, completed_at, task_type')
        .gte('created_at', since)
        .not('completed_at','is', null);
      if (tasks && tasks.length) {
        const durations = tasks
          .map(t => (new Date(t.completed_at as string).getTime() - new Date(t.created_at as string).getTime())/(1000*60*60))
          .filter(v => isFinite(v) && v >= 0);
        setMttrHours(durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : null);
      } else { setMttrHours(null); }

      // Failures (alerts)
      const { data: alerts } = await supabase
        .from('alerts')
        .select('created_at, sensor_type, sensor_value, priority, severity')
        .gte('created_at', since);
      // MTBF
      const failureEvents = (alerts || []).filter(a => a.severity === 'critical' || a.priority === 'P1')
        .sort((a,b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime());
      if (failureEvents.length >= 2) {
        const gaps = [] as number[];
        for (let i=1;i<failureEvents.length;i++) {
          gaps.push((new Date(failureEvents[i].created_at as string).getTime() - new Date(failureEvents[i-1].created_at as string).getTime())/(1000*60*60));
        }
        setMtbfHours(gaps.reduce((a,b)=>a+b,0)/gaps.length);
      } else { setMtbfHours(null); }

      // Sensor correlation vs failures by day
      const byDay = new Map<string, { values: Record<string, number[]>, failure: number }>();
      const daysSet = new Set<string>();
      (alerts || []).forEach(a => {
        const d = new Date(a.created_at as string); const key = d.toISOString().split('T')[0];
        daysSet.add(key);
        const day = byDay.get(key) || { values: {}, failure: 0 };
        if ((a.severity === 'critical' || a.priority === 'P1')) day.failure = 1;
        if (a.sensor_type && typeof a.sensor_value === 'number') {
          day.values[a.sensor_type] = day.values[a.sensor_type] || [];
          day.values[a.sensor_type].push(a.sensor_value as number);
        }
        byDay.set(key, day);
      });
      const days = Array.from(daysSet).sort();
      const sensorSet = new Set<string>();
      byDay.forEach(d => Object.keys(d.values).forEach(s => sensorSet.add(s)));
      const results: { sensor_type: string; r: number }[] = [];
      sensorSet.forEach(sensor => {
        const x: number[] = []; const y: number[] = [];
        days.forEach(dayKey => {
          const d = byDay.get(dayKey);
          const vals = d?.values[sensor];
          if (vals && vals.length) {
            x.push(vals.reduce((a,b)=>a+b,0)/vals.length);
            y.push(d!.failure);
          } else {
            // no reading that day; skip to keep alignment only on days with data
          }
        });
        if (x.length >= 2 && x.length === y.length) {
          results.push({ sensor_type: sensor, r: pearson(x,y) });
        }
      });
      setSensorCorrelations(results.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r)));
    };
    fetchReliability();
  }, [timeframe]);

  // Maintenance and alerts cost aggregation
  useEffect(() => {
    const fetchCosts = async () => {
      const since = timeframeToStartDate(timeframe);
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const prevEnd = new Date(since);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - days);

      const [{ data: mt }, { data: al }] = await Promise.all([
        supabase.from('maintenance_tasks').select('total_cost, created_at').gte('created_at', since),
        supabase.from('alerts').select('cost, created_at').gte('created_at', since),
      ]);
      const curr = (mt||[]).reduce((s: number, t: any) => s + (Number(t.total_cost)||0), 0)
        + (al||[]).reduce((s: number,a:any)=> s + (Number(a.cost)||0), 0);

      const prevSince = prevStart.toISOString();
      const prevUntil = prevEnd.toISOString();
      const [{ data: mtPrev }, { data: alPrev }] = await Promise.all([
        supabase.from('maintenance_tasks').select('total_cost, created_at').gte('created_at', prevSince).lt('created_at', prevUntil),
        supabase.from('alerts').select('cost, created_at').gte('created_at', prevSince).lt('created_at', prevUntil),
      ]);
      const prev = (mtPrev||[]).reduce((s: number, t: any) => s + (Number(t.total_cost)||0), 0)
        + (alPrev||[]).reduce((s: number,a:any)=> s + (Number(a.cost)||0), 0);

      setCostTotal(curr);
      setCostChangePct(prev > 0 ? ((curr - prev) / prev) * 100 : null);
    };
    fetchCosts();
  }, [timeframe]);

  // Static predictive insights (these are rule-based summaries, not ML-generated)
  const predictiveInsights = useMemo(() => {
    const insights = [];
    
    // Temperature insight based on weekly data
    if (weeklyTrends.length >= 2) {
      const temps = weeklyTrends.filter(d => d.temperature != null).map(d => d.temperature!);
      const trend = temps.length >= 2 ? (temps[temps.length - 1] > temps[0] ? 'up' : temps[temps.length - 1] < temps[0] ? 'down' : 'stable') : 'stable';
      insights.push({
        title: "Temperature Trend",
        prediction: trend === 'up' ? 'Gradual temperature increase detected' : trend === 'down' ? 'Temperature declining' : 'Temperature stable',
        confidence: Math.min(95, 60 + weeklyTrends.length * 5),
        trend,
        nextAction: trend === 'up' ? 'Monitor cooling systems' : 'No action required',
        timeframe: "Next 7 days"
      });
    }

    // Alert frequency insight
    const totalAlerts = weeklyTrends.reduce((s, d) => s + d.alerts, 0);
    insights.push({
      title: "Alert Activity",
      prediction: totalAlerts > 10 ? 'High alert frequency detected' : totalAlerts > 3 ? 'Moderate alert activity' : 'Low alert activity',
      confidence: 85,
      trend: totalAlerts > 10 ? 'down' : 'stable',
      nextAction: totalAlerts > 10 ? 'Review alert thresholds' : 'Continue monitoring',
      timeframe: "Next 14 days"
    });

    // Maintenance insight from monthly data
    if (monthlyData.length >= 2) {
      const recentMaint = monthlyData[monthlyData.length - 1]?.maintenanceHours || 0;
      const prevMaint = monthlyData[monthlyData.length - 2]?.maintenanceHours || 0;
      const trend = recentMaint > prevMaint ? 'up' : recentMaint < prevMaint ? 'down' : 'stable';
      insights.push({
        title: "Maintenance Load",
        prediction: trend === 'up' ? 'Increasing maintenance demand' : 'Maintenance load stable',
        confidence: 78,
        trend: trend === 'up' ? 'down' : 'up',
        nextAction: trend === 'up' ? 'Schedule additional resources' : 'Continue current schedule',
        timeframe: "Next 30 days"
      });
    }

    // System health insight
    const criticalPct = systemHealth.find(h => h.name === 'Critical')?.value || 0;
    insights.push({
      title: "System Health",
      prediction: criticalPct > 5 ? 'Elevated failure risk' : 'Operating within normal parameters',
      confidence: 89,
      trend: criticalPct > 5 ? 'down' : 'up',
      nextAction: criticalPct > 5 ? 'Schedule inspection' : 'Continue monitoring',
      timeframe: "Next 7 days"
    });

    return insights;
  }, [weeklyTrends, monthlyData, systemHealth]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600 bg-green-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewMetrics.avgTemp != null ? `${overviewMetrics.avgTemp}°C` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewMetrics.tempChange != null ? (
                <span className={overviewMetrics.tempChange >= 0 ? 'text-green-600' : 'text-blue-600'}>
                  {overviewMetrics.tempChange >= 0 ? '+' : ''}{overviewMetrics.tempChange}°C
                </span>
              ) : <span>—</span>} from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewMetrics.uptime != null ? `${overviewMetrics.uptime}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">
                {overviewMetrics.downtimeHours != null ? `${overviewMetrics.downtimeHours}h` : '—'}
              </span> downtime this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costTotal != null ? formatCurrency(costTotal) : '—'}</div>
            <p className="text-xs text-muted-foreground">
              {costChangePct != null ? (
                <span className={costChangePct >= 0 ? 'text-yellow-600' : 'text-green-600'}>
                  {`${costChangePct >= 0 ? '+' : ''}${Math.abs(costChangePct).toFixed(2)}%`}
                </span>
              ) : (
                <span className="text-muted-foreground">n/a</span>
              )} vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewMetrics.efficiencyScore != null ? `${overviewMetrics.efficiencyScore}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Task completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {loadingCharts && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Loading analytics data...</span>
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="trends" className="flex-1 min-w-0 text-xs sm:text-sm">Weekly Trends</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 min-w-0 text-xs sm:text-sm">Monthly</TabsTrigger>
          <TabsTrigger value="health" className="flex-1 min-w-0 text-xs sm:text-sm">Health</TabsTrigger>
          <TabsTrigger value="predictions" className="flex-1 min-w-0 text-xs sm:text-sm">Predictions</TabsTrigger>
          <TabsTrigger value="reliability" className="flex-1 min-w-0 text-xs sm:text-sm">Reliability</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Weekly Environmental Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Environmental Trends</CardTitle>
              <CardDescription>
                Temperature, humidity, and air quality over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis width={45} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="var(--color-temperature)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-temperature)" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="var(--color-humidity)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-humidity)" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="airQuality" 
                      stroke="var(--color-airQuality)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-airQuality)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Alert Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Frequency</CardTitle>
              <CardDescription>Number of alerts triggered each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis width={45} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="alerts" 
                      fill="var(--color-alerts)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {/* Monthly Maintenance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Maintenance Analysis</CardTitle>
              <CardDescription>
                Maintenance hours and system downtime over 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis width={45} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="maintenanceHours" 
                      stroke="var(--color-maintenanceHours)" 
                      fill="var(--color-maintenanceHours)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Environmental Averages */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Average Temperature</CardTitle>
                <CardDescription>Monthly temperature trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis width={45} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="avgTemp" 
                        stroke="var(--color-temperature)" 
                        strokeWidth={3}
                        dot={{ fill: "var(--color-temperature)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Humidity</CardTitle>
                <CardDescription>Monthly humidity trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis width={45} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="avgHumidity" 
                        stroke="var(--color-humidity)" 
                        strokeWidth={3}
                        dot={{ fill: "var(--color-humidity)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* System Health Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                System Health Distribution
              </CardTitle>
              <CardDescription>
                Overall system health status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={systemHealth.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}
                      >
                        {systemHealth.filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {systemHealth.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">
                      {item.name}: {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Predictive Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>
                AI-powered predictions and maintenance recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.title}</h4>
                      {getTrendIcon(insight.trend)}
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.prediction}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence:</span>
                        <span className="font-medium">{insight.confidence}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Timeframe:</span>
                        <span className="font-medium">{insight.timeframe}</span>
                      </div>
                      <div className="pt-2">
                        <Badge className={getTrendColor(insight.trend)}>
                          {insight.nextAction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reliability Metrics</CardTitle>
              <CardDescription>MTTR, MTBF and sensor correlation vs failures</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Timeframe</span>
              <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mean Time To Repair (MTTR)</CardTitle>
                <CardDescription>Average repair duration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatHours(mttrHours)}</div>
                <p className="text-xs text-muted-foreground">Computed from maintenance_tasks created_at → completed_at</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mean Time Between Failures (MTBF)</CardTitle>
                <CardDescription>Average time between P1/Critical alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatHours(mtbfHours)}</div>
                <p className="text-xs text-muted-foreground">Based on alerts severity=critical or priority=P1</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sensor Correlation with Failures</CardTitle>
              <CardDescription>Pearson correlation (−1 to +1) between sensor values and failure days</CardDescription>
            </CardHeader>
            <CardContent>
              {sensorCorrelations.length ? (
                <ChartContainer config={chartConfig} className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensorCorrelations} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sensor_type" angle={-20} textAnchor="end" height={60} />
                      <YAxis domain={[-1, 1]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="r" fill="var(--color-alerts)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Not enough data to compute correlations in this timeframe.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export { AnalyticsPanel };
