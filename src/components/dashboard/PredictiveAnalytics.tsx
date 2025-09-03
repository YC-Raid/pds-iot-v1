import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calendar, 
  Wrench, 
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useMemo } from "react";

interface DataPoint {
  time: string;
  value: number;
  timestamp: string;
}

interface MaintenancePrediction {
  daysUntilMaintenance: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  maintenanceType: 'routine' | 'preventive' | 'urgent';
  estimatedCost?: string;
}

interface PredictiveAnalyticsProps {
  data: DataPoint[];
  sensorName: string;
  optimalRange?: { min: number; max: number };
  criticalThresholds?: { min?: number; max?: number };
}

const PredictiveAnalytics = ({ 
  data, 
  sensorName, 
  optimalRange, 
  criticalThresholds 
}: PredictiveAnalyticsProps) => {
  
  function getRecommendation(risk: string, type: string, sensor: string): string {
    const recommendations = {
      'low-routine': `Continue monitoring ${sensor}. Next routine check in 90 days.`,
      'medium-preventive': `Schedule preventive maintenance for ${sensor} system within 21 days.`,
      'high-preventive': `Priority maintenance required for ${sensor}. Schedule within 14 days.`,
      'critical-urgent': `URGENT: ${sensor} requires immediate attention. Schedule maintenance within 7 days.`
    };
    
    return recommendations[`${risk}-${type}` as keyof typeof recommendations] || 
           `Monitor ${sensor} system and schedule maintenance as needed.`;
  }

  function getEstimatedCost(type: string): string {
    const costs = {
      routine: '$200-500',
      preventive: '$500-1,500',
      urgent: '$1,500-5,000'
    };
    return costs[type as keyof typeof costs] || '$500-1,000';
  }

  const prediction = useMemo((): MaintenancePrediction => {
    if (data.length < 5) {
      return {
        daysUntilMaintenance: 30,
        confidence: 20,
        riskLevel: 'low',
        recommendation: 'Insufficient data for accurate prediction',
        maintenanceType: 'routine'
      };
    }

    // Calculate trend and rate of change
    const recentData = data.slice(-20);
    const values = recentData.map(d => d.value);
    const timePoints = recentData.map((_, i) => i);
    
    // Linear regression for trend
    const n = values.length;
    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate variance and instability
    const mean = sumY / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const instability = Math.sqrt(variance) / mean * 100;
    
    // Predict when values will exceed thresholds
    let daysUntilMaintenance = 90; // Default
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let maintenanceType: 'routine' | 'preventive' | 'urgent' = 'routine';
    
    const currentValue = values[values.length - 1];
    
    // Check current status against thresholds
    if (criticalThresholds) {
      if (criticalThresholds.max && currentValue > criticalThresholds.max * 0.9) {
        daysUntilMaintenance = 7;
        riskLevel = 'critical';
        maintenanceType = 'urgent';
      } else if (criticalThresholds.max && currentValue > criticalThresholds.max * 0.8) {
        daysUntilMaintenance = 14;
        riskLevel = 'high';
        maintenanceType = 'preventive';
      }
    }
    
    if (optimalRange) {
      const rangeDeviation = Math.max(
        Math.max(0, currentValue - optimalRange.max),
        Math.max(0, optimalRange.min - currentValue)
      ) / ((optimalRange.max - optimalRange.min) / 2);
      
      if (rangeDeviation > 0.5) {
        daysUntilMaintenance = Math.min(daysUntilMaintenance, 21);
        riskLevel = rangeDeviation > 1 ? 'high' : 'medium';
        maintenanceType = 'preventive';
      }
    }
    
    // Factor in trend
    if (Math.abs(slope) > 0.1) {
      const trendImpact = Math.min(30, Math.abs(slope) * 100);
      daysUntilMaintenance = Math.max(7, daysUntilMaintenance - trendImpact);
      if (slope > 0.2) riskLevel = 'medium';
    }
    
    // Factor in instability
    if (instability > 20) {
      daysUntilMaintenance = Math.max(14, daysUntilMaintenance - 7);
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    // Calculate confidence based on data quality
    const confidence = Math.min(95, 30 + (data.length * 2) + (instability < 10 ? 20 : 0));
    
    const recommendation = getRecommendation(riskLevel, maintenanceType, sensorName);
    
    return {
      daysUntilMaintenance,
      confidence,
      riskLevel,
      recommendation,
      maintenanceType,
      estimatedCost: getEstimatedCost(maintenanceType)
    };
  }, [data, sensorName, optimalRange, criticalThresholds]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getProgressColor = (days: number) => {
    if (days <= 7) return 'bg-red-500';
    if (days <= 14) return 'bg-orange-500';
    if (days <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <CardTitle>Predictive Maintenance</CardTitle>
        </div>
        <CardDescription>
          AI-powered maintenance scheduling for {sensorName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Prediction */}
        <div className="p-4 bg-secondary/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Maintenance
            </h4>
            <Badge 
              variant="outline" 
              className={getRiskColor(prediction.riskLevel)}
            >
              {prediction.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
          
          <div className="text-3xl font-bold text-primary mb-1">
            {prediction.daysUntilMaintenance} days
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <CheckCircle2 className="h-4 w-4" />
            {prediction.confidence}% confidence
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (prediction.daysUntilMaintenance / 90 * 100))} 
            className="mb-3"
          />
          
          <p className="text-sm">{prediction.recommendation}</p>
        </div>

        {/* Maintenance Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <Wrench className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-medium">Maintenance Type</div>
            <div className="text-lg font-bold capitalize text-primary">
              {prediction.maintenanceType}
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-medium">Estimated Cost</div>
            <div className="text-lg font-bold text-primary">
              {prediction.estimatedCost}
            </div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm font-medium">Risk Level</div>
            <div className={`text-lg font-bold capitalize ${getRiskColor(prediction.riskLevel)}`}>
              {prediction.riskLevel}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant={prediction.riskLevel === 'critical' ? 'default' : 'outline'}
            size="sm"
          >
            Schedule Maintenance
          </Button>
          <Button variant="outline" size="sm">
            View Maintenance History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalytics;