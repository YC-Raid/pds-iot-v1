import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Brain, Bell, CheckCircle } from "lucide-react";
import { useMemo } from "react";

interface DataPoint {
  time: string;
  value: number;
  timestamp: string;
}

interface AnomalyResult {
  isAnomalous: boolean;
  anomalyScore: number;
  threshold: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AnomalyDetectionProps {
  data: DataPoint[];
  sensorName: string;
  onAnomalyDetected?: (anomaly: AnomalyResult) => void;
}

const AnomalyDetection = ({ data, sensorName, onAnomalyDetected }: AnomalyDetectionProps) => {
  function getRecommendation(severity: string, sensor: string): string {
    const recommendations = {
      low: `Monitor ${sensor} closely for trends`,
      medium: `Investigate ${sensor} readings and check equipment`,
      high: `Immediate inspection required for ${sensor} system`,
      critical: `URGENT: ${sensor} critical anomaly detected - immediate action required`
    };
    return recommendations[severity as keyof typeof recommendations];
  }

  const anomalies = useMemo(() => {
    if (data.length < 10) return [];

    // Simple statistical anomaly detection using z-score
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const threshold = 2.5; // Z-score threshold
    
    return data.map((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      const isAnomalous = zScore > threshold;
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (zScore > 4) severity = 'critical';
      else if (zScore > 3.5) severity = 'high';
      else if (zScore > 3) severity = 'medium';

      const anomaly: AnomalyResult = {
        isAnomalous,
        anomalyScore: zScore,
        threshold,
        recommendation: getRecommendation(severity, sensorName),
        severity
      };

      return {
        ...point,
        ...anomaly,
        index
      };
    }).filter(p => p.isAnomalous);
  }, [data, sensorName]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20 dark:text-destructive-foreground dark:bg-destructive/20 dark:border-destructive/30';
      case 'high': return 'text-warning bg-warning/10 border-warning/20 dark:text-warning-foreground dark:bg-warning/20 dark:border-warning/30';
      case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-400/20 dark:border-yellow-400/30';
      default: return 'text-info bg-info/10 border-info/20 dark:text-info-foreground dark:bg-info/20 dark:border-info/30';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <CardTitle>Anomaly Detection</CardTitle>
        </div>
        <CardDescription>
          Real-time anomaly detection for {sensorName} using statistical analysis
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left side - Key Metrics */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {((1 - anomalies.length / Math.max(data.length, 1)) * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Normal Readings</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <div className="text-3xl font-bold text-warning mb-1">
                {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <span className="text-sm font-medium">Detection Status</span>
              <Badge variant={anomalies.length > 0 ? "destructive" : "default"}>
                {anomalies.length > 0 ? `${anomalies.length} Anomalies` : 'Normal'}
              </Badge>
            </div>
          </div>

          {/* Right side - Scrollable Anomaly Details */}
          <div className="lg:col-span-3">
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Recent Anomalies ({anomalies.length} total)
                </h4>
                
                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                  {anomalies.slice(-10).reverse().map((anomaly, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono">{anomaly.time}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {anomaly.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Score: {anomaly.anomalyScore.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Value: {anomaly.value.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {anomaly.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-center">
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-success mx-auto" />
                  <h4 className="text-lg font-medium">All Clear</h4>
                  <p className="text-sm text-muted-foreground">
                    No anomalies detected in the current dataset.
                    The system is operating within normal parameters.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomalyDetection;