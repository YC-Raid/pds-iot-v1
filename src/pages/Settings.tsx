import { Card } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import SettingsTab from "@/components/settings/SettingsTab";
import DataRetentionMonitor from "@/components/settings/DataRetentionMonitor";

export default function Settings() {
  return (
    <>
      <SEO title="Hangar Guardian — Settings" description="Manage notification preferences and user roles." />
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <Card className="p-0 border-0 shadow-none">
          <SettingsTab />
        </Card>
        <DataRetentionMonitor />
      </div>
    </>
  );
}
