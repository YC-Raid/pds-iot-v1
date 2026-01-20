import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Timer, Moon, Sun, Save } from "lucide-react";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export const SecuritySettings = () => {
  const { settings, saveSettings, DEFAULT_SETTINGS } = useSecuritySettings();
  
  const [nightModeStart, setNightModeStart] = useState(settings.nightModeStart);
  const [nightModeEnd, setNightModeEnd] = useState(settings.nightModeEnd);
  const [maxOpenDuration, setMaxOpenDuration] = useState(settings.maxOpenDurationSeconds);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with settings
  useEffect(() => {
    setNightModeStart(settings.nightModeStart);
    setNightModeEnd(settings.nightModeEnd);
    setMaxOpenDuration(settings.maxOpenDurationSeconds);
  }, [settings]);

  // Check for changes
  useEffect(() => {
    const changed = 
      nightModeStart !== settings.nightModeStart ||
      nightModeEnd !== settings.nightModeEnd ||
      maxOpenDuration !== settings.maxOpenDurationSeconds;
    setHasChanges(changed);
  }, [nightModeStart, nightModeEnd, maxOpenDuration, settings]);

  const handleSave = () => {
    saveSettings({
      nightModeStart,
      nightModeEnd,
      maxOpenDurationSeconds: maxOpenDuration,
    });
    toast({
      title: "Security Settings Saved",
      description: "Your intrusion detection settings have been updated.",
    });
  };

  const handleReset = () => {
    setNightModeStart(DEFAULT_SETTINGS.nightModeStart);
    setNightModeEnd(DEFAULT_SETTINGS.nightModeEnd);
    setMaxOpenDuration(DEFAULT_SETTINGS.maxOpenDurationSeconds);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Configure intrusion detection parameters. Alerts trigger when the door is opened during night mode
          or left open beyond the maximum duration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Night Mode Time Range */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Moon className="h-4 w-4 text-indigo-500" />
            Night Mode (Restricted Hours)
          </div>
          <p className="text-xs text-muted-foreground">
            Door openings during these hours will trigger an intrusion alert.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="night-start" className="flex items-center gap-2">
                <Moon className="h-3.5 w-3.5" />
                Start Time
              </Label>
              <Input
                id="night-start"
                type="time"
                value={nightModeStart}
                onChange={(e) => setNightModeStart(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="night-end" className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5" />
                End Time
              </Label>
              <Input
                id="night-end"
                type="time"
                value={nightModeEnd}
                onChange={(e) => setNightModeEnd(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Max Open Duration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Timer className="h-4 w-4 text-amber-500" />
            Maximum Door Open Duration
          </div>
          <p className="text-xs text-muted-foreground">
            If the door remains open longer than this duration, an alert will trigger regardless of time of day.
          </p>
          <div className="space-y-2">
            <Label htmlFor="max-duration" className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Duration (seconds)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="max-duration"
                type="number"
                min={30}
                max={3600}
                step={30}
                value={maxOpenDuration}
                onChange={(e) => setMaxOpenDuration(Number(e.target.value))}
                className="bg-background max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                ({Math.floor(maxOpenDuration / 60)}:{(maxOpenDuration % 60).toString().padStart(2, "0")} min)
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>

        {/* Current Status Preview */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Night Mode: <span className="text-foreground font-medium">{nightModeStart}</span> to <span className="text-foreground font-medium">{nightModeEnd}</span></li>
            <li>• Max Open Duration: <span className="text-foreground font-medium">{maxOpenDuration} seconds</span> ({Math.floor(maxOpenDuration / 60)} min {maxOpenDuration % 60} sec)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
