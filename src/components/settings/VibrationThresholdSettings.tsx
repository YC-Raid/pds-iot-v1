import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Save } from "lucide-react";

const VibrationThresholdSettings = () => {
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState({
    foundation_stress_threshold: 2.0,
    wall_integrity_threshold: 1.5,
    roof_stability_threshold: 1.0
  });
  const [loading, setLoading] = useState(false);

  // Fetch current thresholds
  useEffect(() => {
    const fetchThresholds = async () => {
      const { data, error } = await supabase
        .from('vibration_monitoring_settings')
        .select('*')
        .eq('location', 'hangar_01')
        .maybeSingle();
      
      if (data && !error) {
        setThresholds({
          foundation_stress_threshold: data.foundation_stress_threshold,
          wall_integrity_threshold: data.wall_integrity_threshold,
          roof_stability_threshold: data.roof_stability_threshold
        });
      }
    };

    fetchThresholds();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('vibration_monitoring_settings')
      .upsert({
        location: 'hangar_01',
        foundation_stress_threshold: thresholds.foundation_stress_threshold,
        wall_integrity_threshold: thresholds.wall_integrity_threshold,
        roof_stability_threshold: thresholds.roof_stability_threshold
      }, {
        onConflict: 'location'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save vibration thresholds.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Vibration thresholds updated successfully.",
      });
    }
    
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setThresholds(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Vibration Monitoring Thresholds
        </CardTitle>
        <CardDescription>
          Configure the thresholds used to calculate structural health metrics from vibration data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="foundation_threshold">Foundation Stress Threshold</Label>
            <Input
              id="foundation_threshold"
              type="number"
              step="0.1"
              min="0.1"
              value={thresholds.foundation_stress_threshold}
              onChange={(e) => handleInputChange('foundation_stress_threshold', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              m/s² - Acceleration threshold for foundation stress calculation
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wall_threshold">Wall Integrity Threshold</Label>
            <Input
              id="wall_threshold"
              type="number"
              step="0.1"
              min="0.1"
              value={thresholds.wall_integrity_threshold}
              onChange={(e) => handleInputChange('wall_integrity_threshold', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              m/s² - Lateral force threshold for wall damage calculation
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roof_threshold">Roof Stability Threshold</Label>
            <Input
              id="roof_threshold"
              type="number"
              step="0.1"
              min="0.1"
              value={thresholds.roof_stability_threshold}
              onChange={(e) => handleInputChange('roof_stability_threshold', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              °/s - Angular velocity threshold for roof damage calculation
            </p>
          </div>
        </div>
        
        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Thresholds'}
          </Button>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">How Thresholds Work:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Foundation Stress:</strong> Higher values make the system less sensitive to ground vibrations</li>
            <li>• <strong>Wall Integrity:</strong> Higher values make the system less sensitive to lateral forces</li>
            <li>• <strong>Roof Stability:</strong> Higher values make the system less sensitive to rotational motion</li>
            <li>• Lower thresholds = more sensitive monitoring, Higher thresholds = less sensitive monitoring</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VibrationThresholdSettings;