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
import { Shield, Bell, Settings, Save, Users } from "lucide-react";

interface NotificationSettingsRow {
  id?: string;
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  alert_threshold_temp: number | null;
  alert_threshold_humidity: number | null;
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

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile?.role]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('notification_settings')
        .select('id,user_id,in_app_enabled,email_enabled,push_enabled,alert_threshold_temp,alert_threshold_humidity')
        .eq('user_id', user.id)
        .maybeSingle();

      setNotif(
        data || {
          user_id: user.id,
          in_app_enabled: true,
          email_enabled: true,
          push_enabled: true,
          alert_threshold_temp: 25,
          alert_threshold_humidity: 60,
        }
      );
    };
    load();
  }, [user?.id]);

  const saveNotif = async () => {
    if (!user || !notif) return;
    setSaving(true);
    try {
      // If row has id -> update; else insert
      if ((notif as any).id) {
        const { error } = await supabase
          .from('notification_settings')
          .update({
            in_app_enabled: notif.in_app_enabled,
            email_enabled: notif.email_enabled,
            push_enabled: notif.push_enabled,
            alert_threshold_temp: notif.alert_threshold_temp,
            alert_threshold_humidity: notif.alert_threshold_humidity,
          })
          .eq('id', (notif as any).id);
        if (error) throw error;
      } else {
        const { error, data } = await supabase
          .from('notification_settings')
          .insert([
            {
              user_id: user.id,
              in_app_enabled: notif.in_app_enabled,
              email_enabled: notif.email_enabled,
              push_enabled: notif.push_enabled,
              alert_threshold_temp: notif.alert_threshold_temp,
              alert_threshold_humidity: notif.alert_threshold_humidity,
            },
          ])
          .select('id')
          .single();
        if (error) throw error;
        setNotif({ ...notif, id: data?.id });
      }
      toast.success('Notification settings saved');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
      // Try update first
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

  return (
    <div className="space-y-6" role="region" aria-label="Settings">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your preferences and platform administration</p>
        </div>
        <Badge variant={isAdmin ? 'default' : 'secondary'} className="capitalize">
          <Shield className="h-3 w-3 mr-1" /> {profile?.role || 'viewer'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notifications */}
        <Card as-child>
          <section>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle>
              <CardDescription>Configure alert channels and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="inapp">In‑app</Label>
                  <Switch id="inapp" checked={!!notif?.in_app_enabled} onCheckedChange={(v) => setNotif((n) => n ? { ...n, in_app_enabled: v } : n)} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="email">Email</Label>
                  <Switch id="email" checked={!!notif?.email_enabled} onCheckedChange={(v) => setNotif((n) => n ? { ...n, email_enabled: v } : n)} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="push">Push</Label>
                  <Switch id="push" checked={!!notif?.push_enabled} onCheckedChange={(v) => setNotif((n) => n ? { ...n, push_enabled: v } : n)} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="temp">Temperature threshold (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 25"
                    value={notif?.alert_threshold_temp ?? ''}
                    onChange={(e) => setNotif((n) => n ? { ...n, alert_threshold_temp: e.target.value === '' ? null : Number(e.target.value) } : n)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hum">Humidity threshold (%)</Label>
                  <Input
                    id="hum"
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 60"
                    value={notif?.alert_threshold_humidity ?? ''}
                    onChange={(e) => setNotif((n) => n ? { ...n, alert_threshold_humidity: e.target.value === '' ? null : Number(e.target.value) } : n)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveNotif} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </section>
        </Card>

        {/* Admin: User Roles */}
        <Card as-child>
          <section aria-disabled={!isAdmin} aria-label="User roles">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> User Roles</CardTitle>
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
                      <div className="w-40">
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
          </section>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Platform</CardTitle>
          <CardDescription>General preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Placeholder for future settings */}
          <p className="text-sm text-muted-foreground">More settings coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
