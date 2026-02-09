import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Shield, Bell, Settings, Save, Users, Thermometer, Droplets, Gauge, Wind, Activity, AlertTriangle, Building } from "lucide-react";

interface VibrationMonitoringSettings {
  foundation_stress_threshold: number;
  wall_integrity_threshold: number;
  roof_stability_threshold: number;
}

interface NotificationSettingsRow {
  id?: string;
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  alert_threshold_temp: number | null;
  alert_threshold_temp_min: number | null;
  alert_threshold_humidity: number | null;
  alert_threshold_pressure_min: number | null;
  alert_threshold_pressure_max: number | null;
  alert_threshold_pm25: number | null;
  alert_threshold_pm25_critical: number | null;
  alert_threshold_vibration: number | null;
  alert_threshold_anomaly_score: number | null;
  alert_threshold_failure_prob: number | null;
}

interface SimpleUser {
  user_id: string;
  nickname: string;
  role: 'admin' | 'viewer';
}

export default function SettingsTab() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [notif, setNotif] = useState<NotificationSettingsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [vibrationSettings, setVibrationSettings] = useState<VibrationMonitoringSettings>({
    foundation_stress_threshold: 2.0,
    wall_integrity_threshold: 1.5,
    roof_stability_threshold: 1.0
  });

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile?.role]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      
      // Load notification settings
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setNotif(
        data || {
          user_id: user.id,
          in_app_enabled: true,
          email_enabled: true,
          push_enabled: true,
          alert_threshold_temp: 25,
          alert_threshold_temp_min: 15,
          alert_threshold_humidity: 60,
          alert_threshold_pressure_min: 1000,
          alert_threshold_pressure_max: 1020,
          alert_threshold_pm25: 35,
          alert_threshold_pm25_critical: 75,
          alert_threshold_vibration: 30,
          alert_threshold_anomaly_score: 0.6,
          alert_threshold_failure_prob: 0.4,
        }
      );

      // Load vibration monitoring settings
      const { data: vibData } = await supabase
        .from('vibration_monitoring_settings')
        .select('*')
        .eq('location', 'hangar_01')
        .maybeSingle();
      
      if (vibData) {
        setVibrationSettings({
          foundation_stress_threshold: vibData.foundation_stress_threshold,
          wall_integrity_threshold: vibData.wall_integrity_threshold,
          roof_stability_threshold: vibData.roof_stability_threshold
        });
      }
    };
    load();
  }, [user?.id]);

  const saveNotif = async () => {
    if (!user || !notif) return;

    // Validate threshold relationships
    if (notif.alert_threshold_temp_min != null && notif.alert_threshold_temp != null &&
        notif.alert_threshold_temp_min >= notif.alert_threshold_temp) {
      toast.error('Temperature minimum must be less than maximum');
      return;
    }
    if (notif.alert_threshold_pressure_min != null && notif.alert_threshold_pressure_max != null &&
        notif.alert_threshold_pressure_min >= notif.alert_threshold_pressure_max) {
      toast.error('Pressure minimum must be less than maximum');
      return;
    }
    if (notif.alert_threshold_pm25 != null && notif.alert_threshold_pm25_critical != null &&
        notif.alert_threshold_pm25 >= notif.alert_threshold_pm25_critical) {
      toast.error('PM2.5 warning threshold must be less than critical threshold');
      return;
    }
    if (notif.alert_threshold_anomaly_score != null && (notif.alert_threshold_anomaly_score < 0 || notif.alert_threshold_anomaly_score > 1)) {
      toast.error('Anomaly score must be between 0 and 1');
      return;
    }
    if (notif.alert_threshold_failure_prob != null && (notif.alert_threshold_failure_prob < 0 || notif.alert_threshold_failure_prob > 1)) {
      toast.error('Failure probability must be between 0 and 1');
      return;
    }

    setSaving(true);
    try {
      const settingsData = {
        in_app_enabled: notif.in_app_enabled,
        email_enabled: notif.email_enabled,
        push_enabled: notif.push_enabled,
        alert_threshold_temp: notif.alert_threshold_temp,
        alert_threshold_temp_min: notif.alert_threshold_temp_min,
        alert_threshold_humidity: notif.alert_threshold_humidity,
        alert_threshold_pressure_min: notif.alert_threshold_pressure_min,
        alert_threshold_pressure_max: notif.alert_threshold_pressure_max,
        alert_threshold_pm25: notif.alert_threshold_pm25,
        alert_threshold_pm25_critical: notif.alert_threshold_pm25_critical,
        alert_threshold_vibration: notif.alert_threshold_vibration,
        alert_threshold_anomaly_score: notif.alert_threshold_anomaly_score,
        alert_threshold_failure_prob: notif.alert_threshold_failure_prob,
      };

      if ((notif as any).id) {
        const { error } = await supabase
          .from('notification_settings')
          .update(settingsData)
          .eq('id', (notif as any).id);
        if (error) throw error;
      } else {
        const { error, data } = await supabase
          .from('notification_settings')
          .insert([{ user_id: user.id, ...settingsData }])
          .select('id')
          .single();
        if (error) throw error;
        setNotif({ ...notif, id: data?.id });
      }

      // Save vibration monitoring settings
      const { error: vibError } = await supabase
        .from('vibration_monitoring_settings')
        .upsert({
          location: 'hangar_01' as const,
          foundation_stress_threshold: vibrationSettings.foundation_stress_threshold,
          wall_integrity_threshold: vibrationSettings.wall_integrity_threshold,
          roof_stability_threshold: vibrationSettings.roof_stability_threshold
        }, { onConflict: 'location' });
      
      if (vibError) throw vibError;

      toast.success('All threshold settings saved successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleVibrationSettingChange = (field: keyof VibrationMonitoringSettings, value: string) => {
    const numValue = value === '' ? 0.1 : parseFloat(value);
    if (!isNaN(numValue)) {
      setVibrationSettings(prev => ({ ...prev, [field]: numValue }));
    }
  };

  // Admin: users and roles
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return;
      setLoadingUsers(true);
      try {
        const [{ data: profiles }, { data: roles }] = await Promise.all([
          supabase.from('profiles').select('user_id,nickname'),
          supabase.from('user_roles').select('user_id,role'),
        ]);
        const roleMap = new Map<string, 'admin' | 'viewer'>();
        (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));
        const merged: SimpleUser[] = (profiles || []).map((p: any) => ({
          user_id: p.user_id,
          nickname: p.nickname,
          role: (roleMap.get(p.user_id) as 'admin' | 'viewer') || 'viewer',
        }));
        setUsers(merged);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [isAdmin]);

  const changeRole = async (user_id: string, role: 'admin' | 'viewer') => {
    try {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id, role }]);
        if (error) throw error;
      }

      setUsers((prev) => prev.map((u) => (u.user_id === user_id ? { ...u, role } : u)));
      toast.success('Role updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update role (admin only)');
    }
  };

  const handleNumericChange = (field: keyof NotificationSettingsRow, value: string) => {
    setNotif((n) => n ? { ...n, [field]: value === '' ? null : Number(value) } : n);
  };

  return (
    <div className="space-y-6" role="region" aria-label="Settings">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage alert thresholds and notification preferences</p>
        </div>
        <Badge variant={isAdmin ? 'default' : 'secondary'} className="capitalize">
          <Shield className="h-3 w-3 mr-1" /> {profile?.role || 'viewer'}
        </Badge>
      </div>

      {/* Alert Thresholds Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>
            Configure when alerts are triggered. The system uses your thresholds for all anomaly detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <h4 className="font-medium">Temperature (°C)</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="temp-min">Minimum Threshold</Label>
                <Input
                  id="temp-min"
                  type="number"
                  inputMode="decimal"
                  placeholder="15"
                  value={notif?.alert_threshold_temp_min ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_temp_min', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="temp-max">Maximum Threshold</Label>
                <Input
                  id="temp-max"
                  type="number"
                  inputMode="decimal"
                  placeholder="30"
                  value={notif?.alert_threshold_temp ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_temp', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Humidity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <h4 className="font-medium">Humidity (%)</h4>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="humidity-max">Maximum Threshold</Label>
              <Input
                id="humidity-max"
                type="number"
                inputMode="decimal"
                placeholder="70"
                value={notif?.alert_threshold_humidity ?? ''}
                onChange={(e) => handleNumericChange('alert_threshold_humidity', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Alert triggers above this humidity level</p>
            </div>
          </div>

          <Separator />

          {/* Pressure */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-purple-500" />
              <h4 className="font-medium">Pressure (hPa)</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pressure-min">Minimum Threshold</Label>
                <Input
                  id="pressure-min"
                  type="number"
                  inputMode="decimal"
                  placeholder="1000"
                  value={notif?.alert_threshold_pressure_min ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_pressure_min', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pressure-max">Maximum Threshold</Label>
                <Input
                  id="pressure-max"
                  type="number"
                  inputMode="decimal"
                  placeholder="1020"
                  value={notif?.alert_threshold_pressure_max ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_pressure_max', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Air Quality (PM2.5) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-green-500" />
              <h4 className="font-medium">Air Quality - PM2.5 (μg/m³)</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pm25-warning">Warning Threshold</Label>
                <Input
                  id="pm25-warning"
                  type="number"
                  inputMode="decimal"
                  placeholder="35"
                  value={notif?.alert_threshold_pm25 ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_pm25', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pm25-critical">Critical Threshold</Label>
                <Input
                  id="pm25-critical"
                  type="number"
                  inputMode="decimal"
                  placeholder="75"
                  value={notif?.alert_threshold_pm25_critical ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_pm25_critical', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Vibration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              <h4 className="font-medium">Vibration Monitoring</h4>
            </div>
            
            {/* Alert Threshold */}
            <div className="grid gap-2">
              <Label htmlFor="vibration">Alert Threshold (m/s²)</Label>
              <Input
                id="vibration"
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="10"
                value={notif?.alert_threshold_vibration ?? ''}
                onChange={(e) => handleNumericChange('alert_threshold_vibration', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Gravity-corrected acceleration magnitude for triggering alerts</p>
            </div>

            {/* Structural Health Thresholds */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Structural Health Thresholds</span>
              </div>
              <p className="text-xs text-muted-foreground">
                These thresholds control the sensitivity of structural health calculations in the Vibration Monitoring panel.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="foundation_threshold" className="text-xs">Foundation Stress</Label>
                  <Input
                    id="foundation_threshold"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={vibrationSettings.foundation_stress_threshold}
                    onChange={(e) => handleVibrationSettingChange('foundation_stress_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">m/s²</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wall_threshold" className="text-xs">Wall Integrity</Label>
                  <Input
                    id="wall_threshold"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={vibrationSettings.wall_integrity_threshold}
                    onChange={(e) => handleVibrationSettingChange('wall_integrity_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">m/s²</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="roof_threshold" className="text-xs">Roof Stability</Label>
                  <Input
                    id="roof_threshold"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={vibrationSettings.roof_stability_threshold}
                    onChange={(e) => handleVibrationSettingChange('roof_stability_threshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">°/s</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Lower values = more sensitive monitoring. Higher values = less sensitive.
              </p>
            </div>
          </div>

          <Separator />

          {/* Anomaly & Failure */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h4 className="font-medium">Predictive Analytics</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="anomaly">Anomaly Score (0-1)</Label>
                <Input
                  id="anomaly"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="1"
                  placeholder="0.6"
                  value={notif?.alert_threshold_anomaly_score ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_anomaly_score', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="failure">Failure Probability (0-1)</Label>
                <Input
                  id="failure"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="1"
                  placeholder="0.4"
                  value={notif?.alert_threshold_failure_prob ?? ''}
                  onChange={(e) => handleNumericChange('alert_threshold_failure_prob', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Values closer to 0 trigger alerts more frequently; closer to 1 requires higher anomaly/failure risk
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={saveNotif} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> Save All Thresholds
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notification Channels
            </CardTitle>
            <CardDescription>Choose how you want to receive alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="inapp">In‑app Notifications</Label>
                <Switch 
                  id="inapp" 
                  checked={!!notif?.in_app_enabled} 
                  onCheckedChange={(v) => setNotif((n) => n ? { ...n, in_app_enabled: v } : n)} 
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="email">Email Notifications</Label>
                <Switch 
                  id="email" 
                  checked={!!notif?.email_enabled} 
                  onCheckedChange={(v) => setNotif((n) => n ? { ...n, email_enabled: v } : n)} 
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="push">Push Notifications</Label>
                <Switch 
                  id="push" 
                  checked={!!notif?.push_enabled} 
                  onCheckedChange={(v) => setNotif((n) => n ? { ...n, push_enabled: v } : n)} 
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveNotif} disabled={saving} variant="outline">
                <Save className="h-4 w-4 mr-2" /> Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin: User Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Roles
            </CardTitle>
            <CardDescription>Grant or revoke platform roles (admin only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAdmin ? (
              <p className="text-muted-foreground">You need admin rights to manage roles.</p>
            ) : (
              <div className="space-y-3">
                {loadingUsers && <p className="text-sm text-muted-foreground">Loading users…</p>}
                {users.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{u.nickname}</p>
                      <p className="text-xs text-muted-foreground">{u.user_id.slice(0,8)}…</p>
                    </div>
                    <div className="w-32">
                      <Select
                        value={u.role}
                        onValueChange={(val) => changeRole(u.user_id, val as 'admin' | 'viewer')}
                      >
                        <SelectTrigger className="bg-popover z-50">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-50">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Platform
          </CardTitle>
          <CardDescription>General preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">More settings coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
