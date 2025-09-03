import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Brain, Bell } from "lucide-react";
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

      if (isAnomalous && onAnomalyDetected) {
        onAnomalyDetected(anomaly);
      }

      return {
        ...point,
        ...anomaly,
        index
      };
    }).filter(p => p.isAnomalous);
  }, [data, sensorName, onAnomalyDetected]);

  const getRecommendation = (severity: string, sensor: string): string => {
    const recommendations = {
      low: `Monitor ${sensor} closely for trends`,
      medium: `Investigate ${sensor} readings and check equipment`,
      high: `Immediate inspection required for ${sensor} system`,
      critical: `URGENT: ${sensor} critical anomaly detected - immediate action required`
    };
    return recommendations[severity as keyof typeof recommendations];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
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

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Detection Status</span>
          <Badge variant={anomalies.length > 0 ? "destructive" : "default"}>
            {anomalies.length > 0 ? `${anomalies.length} Anomalies` : 'Normal'}
          </Badge>
        </div>

        {anomalies.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recent Anomalies
            </h4>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {anomalies.slice(-5).map((anomaly, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono">{anomaly.time}</span>
                    <Badge variant="outline" className="text-xs">
                      Score: {anomaly.anomalyScore.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">
                    Value: {anomaly.value.toFixed(2)}
                  </p>
                  <p className="text-xs mt-1">
                    {anomaly.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {((1 - anomalies.length / Math.max(data.length, 1)) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Normal Readings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomalyDetection;