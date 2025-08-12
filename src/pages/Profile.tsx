import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo/SEO";
import { JsonLd } from "@/components/seo/JsonLd";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { profile, refetch } = useUserProfile();
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.nickname) setNickname(profile.nickname);
  }, [profile]);

  const onSave = async () => {
    if (!profile?.id) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ nickname })
        .eq("user_id", profile.id);
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your display name has been saved." });
      await refetch();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEO title="Hangar Guardian — Profile" description="Manage your profile information and display name." />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile?.nickname || "User",
        email: profile?.email,
        identifier: profile?.id,
      }} />
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">View and edit your account details.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Basic information linked to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ""} disabled aria-readonly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={(profile?.role ?? "viewer").toString()} disabled aria-readonly />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Display name</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNickname(profile?.nickname || "")} disabled={saving}>
                Reset
              </Button>
              <Button onClick={onSave} disabled={saving || nickname.trim().length === 0}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
