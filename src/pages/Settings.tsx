import { Card } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import SettingsTab from "@/components/settings/SettingsTab";

export default function Settings() {
  return (
    <>
      <SEO title="Hangar Guardian — Settings" description="Manage notification preferences and user roles." />
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your preferences and platform options.</p>
        </header>
        <Card className="p-0 border-0 shadow-none">
          <SettingsTab />
        </Card>
      </div>
    </>
  );
}
