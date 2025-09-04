interface ThresholdConfig {
  value: number;
  label: string;
  color: string;
  type: 'critical' | 'warning';
}

interface ThresholdCalculationResult {
  thresholds: ThresholdConfig[];
  optimalRange: { min: number; max: number };
  yAxisRange: { min: number; max: number };
  statistics: {
    mean: number;
    std: number;
    min: number;
    max: number;
    count: number;
    zScoreThreshold: number;
  };
}

interface SensorDataPoint {
  value: number;
  timestamp: string;
}

export const calculateDynamicThresholds = (
  data: SensorDataPoint[],
  sensorType: string,
  zScoreThreshold: number = 3
): ThresholdCalculationResult => {
  if (!data || data.length < 10) {
    // Fallback for insufficient data
    return {
      thresholds: [],
      optimalRange: { min: 0, max: 100 },
      yAxisRange: { min: 0, max: 100 },
      statistics: {
        mean: 0,
        std: 0,
        min: 0,
        max: 100,
        count: 0,
        zScoreThreshold
      }
    };
  }

  const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
  
  if (values.length === 0) {
    return {
      thresholds: [],
      optimalRange: { min: 0, max: 100 },
      yAxisRange: { min: 0, max: 100 },
      statistics: {
        mean: 0,
        std: 0,
        min: 0,
        max: 100,
        count: 0,
        zScoreThreshold
      }
    };
  }

  // Calculate basic statistics
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate thresholds using z-score method
  const highCritical = mean + (zScoreThreshold * std);
  const lowCritical = mean - (zScoreThreshold * std);

  // Calculate optimal range (1 std deviation from mean)
  const optimalMin = mean - std;
  const optimalMax = mean + std;

  // Calculate Y-axis range with 10% padding
  const dataRange = max - min;
  const padding = dataRange * 0.1;
  const yAxisMin = Math.max(0, min - padding); // Don't go below 0 for temperature
  const yAxisMax = max + padding;

  // Define threshold colors based on sensor type
  const colors = getSensorColors(sensorType);

  const thresholds: ThresholdConfig[] = [
    {
      value: Math.max(0, lowCritical), // Don't allow negative temperatures for now
      label: 'Low Critical',
      color: colors.lowCritical,
      type: 'critical'
    },
    {
      value: highCritical,
      label: 'High Critical',
      color: colors.highCritical,
      type: 'critical'
    }
  ];

  return {
    thresholds: thresholds.filter(t => t.value > 0), // Filter out invalid thresholds
    optimalRange: {
      min: Math.max(0, optimalMin),
      max: optimalMax
    },
    yAxisRange: {
      min: yAxisMin,
      max: yAxisMax
    },
    statistics: {
      mean,
      std,
      min,
      max,
      count: values.length,
      zScoreThreshold
    }
  };
};

const getSensorColors = (sensorType: string) => {
  const colorSets = {
    temperature: {
      lowCritical: '#3b82f6',   // Blue for cold
      lowWarning: '#06b6d4',    // Light blue
      highWarning: '#f59e0b',   // Orange
      highCritical: '#ef4444'   // Red for hot
    },
    humidity: {
      lowCritical: '#8b5cf6',   // Purple
      lowWarning: '#a78bfa',    
      highWarning: '#f59e0b',   // Orange
      highCritical: '#ef4444'   // Red
    },
    pressure: {
      lowCritical: '#06b6d4',   // Cyan
      lowWarning: '#0891b2',    
      highWarning: '#f59e0b',   // Orange
      highCritical: '#ef4444'   // Red
    }
  };

  return colorSets[sensorType] || colorSets.temperature;
};

export const detectAnomalies = (
  data: SensorDataPoint[],
  zScoreThreshold: number = 3
): Array<SensorDataPoint & { isAnomaly: boolean; zScore: number }> => {
  if (!data || data.length < 3) return [];

  const values = data.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  return data.map(point => {
    const zScore = std === 0 ? 0 : Math.abs(point.value - mean) / std;
    return {
      ...point,
      isAnomaly: zScore > zScoreThreshold,
      zScore
    };
  });
};