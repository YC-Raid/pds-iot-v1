import { Card, CardContent } from "@/components/ui/card";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  sensorType?: string;
}

export const CustomTooltip = ({ active, payload, label, sensorType }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formatValue = (value: number, dataKey: string) => {
    if (dataKey.includes('magnitude') || dataKey.includes('axis')) {
      return value.toFixed(3);
    }
    if (dataKey === 'temperature') {
      return value.toFixed(2);
    }
    if (dataKey === 'humidity') {
      return value.toFixed(1);
    }
    if (dataKey === 'pressure') {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2 });
    }
    return value.toString();
  };

  const getUnit = (dataKey: string) => {
    const units = {
      temperature: '°C',
      humidity: '%', 
      pressure: 'hPa',
      gas_resistance: 'Ω',
      pm1_0: 'μg/m³',
      pm2_5: 'μg/m³', 
      pm10: 'μg/m³',
      value: getValueUnit(),
      x_axis: getAxisUnit(),
      y_axis: getAxisUnit(),
      z_axis: getAxisUnit(),
      magnitude: getAxisUnit()
    };
    return units[dataKey] || '';
  };

  const getValueUnit = () => {
    const units = {
      temperature: '°C',
      humidity: '%',
      pressure: 'hPa', 
      gas: 'Ω',
      pm1: 'μg/m³',
      pm25: 'μg/m³',
      pm10: 'μg/m³'
    };
    return units[sensorType] || '';
  };

  const getAxisUnit = () => {
    if (sensorType === 'acceleration') return 'm/s²';
    if (sensorType === 'rotation') return '°/s';
    return '';
  };

  const getDisplayName = (dataKey: string) => {
    const names = {
      temperature: 'Temperature',
      humidity: 'Humidity',
      pressure: 'Pressure', 
      gas_resistance: 'Gas Quality',
      pm1_0: 'PM1.0',
      pm2_5: 'PM2.5',
      pm10: 'PM10',
      value: sensorType ? sensorType.charAt(0).toUpperCase() + sensorType.slice(1) : 'Value',
      x_axis: 'X-Axis',
      y_axis: 'Y-Axis', 
      z_axis: 'Z-Axis',
      magnitude: 'Magnitude'
    };
    return names[dataKey] || dataKey;
  };

  return (
    <Card className="bg-background/95 backdrop-blur border shadow-lg">
      <CardContent className="p-3">
        <div className="text-sm font-semibold mb-2">{label}</div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">
                  {getDisplayName(entry.dataKey)} ({getUnit(entry.dataKey)})
                </span>
              </div>
              <span className="font-medium">
                {formatValue(entry.value, entry.dataKey)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};