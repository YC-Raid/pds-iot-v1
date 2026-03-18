import { Card } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import SettingsTab from "@/components/settings/SettingsTab";
import DataRetentionMonitor from "@/components/settings/DataRetentionMonitor";
import { RDSIntegration } from "@/components/dashboard/RDSIntegration";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Settings() {
  const { profile } = useUserProfile();
  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <SEO title="Hangar Guardian — Settings" description="Manage notification preferences and user roles." />
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <Card className="p-0 border-0 shadow-none">
          <SettingsTab />
        </Card>
        {isAdmin && <DataRetentionMonitor />}
        {isAdmin && <RDSIntegration />}
      </div>
    </>
  );
}
