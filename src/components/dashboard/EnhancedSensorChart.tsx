import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Calendar
} from "lucide-react";
import { useMemo } from "react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ThresholdConfig {
  value: number;
  label: string;
  color: string;
  type: 'warning' | 'critical' | 'optimal';
}

interface SensorConfig {
  name: string;
  unit: string;
  icon: React.ElementType;
  thresholds: ThresholdConfig[];
  optimalRange?: { min: number; max: number };
  yAxisRange?: { min: number; max: number };
  description?: string;
}

interface DataPoint {
  time: string;
  value: number;
  timestamp: string;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  isAnomalous: boolean;
  prediction: string;
  recommendation?: string;
}

interface EnhancedSensorChartProps {
  data: DataPoint[];
  config: SensorConfig;
  title: string;
  timeRange: string;
  isLoading?: boolean;
  timeRangeSelector?: React.ReactNode;
}

const EnhancedSensorChart = ({ data, config, title, timeRange, isLoading, timeRangeSelector }: EnhancedSensorChartProps) => {
  // Calculate trend analysis
  const trendAnalysis = useMemo((): TrendAnalysis => {
    if (data.length < 2) return { direction: 'stable', percentage: 0, isAnomalous: false, prediction: 'Insufficient data' };

    const recent = data.slice(-10); // Last 10 readings
    const older = data.slice(-20, -10); // Previous 10 readings
    
    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, d) => sum + d.value, 0) / older.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    const direction = Math.abs(change) < 1 ? 'stable' : change > 0 ? 'up' : 'down';
    
    // Check if current values are outside optimal range
    const currentValue = data[data.length - 1]?.value || 0;
    const isAnomalous = config.optimalRange 
      ? currentValue < config.optimalRange.min || currentValue > config.optimalRange.max
      : config.thresholds.some(t => t.type === 'critical' && 
          (currentValue > t.value || currentValue < t.value));

    let prediction = '';
    let recommendation = '';

    if (direction === 'up' && change > 5) {
      prediction = 'Increasing trend detected';
      recommendation = 'Monitor closely, consider preventive action';
    } else if (direction === 'down' && change < -5) {
      prediction = 'Decreasing trend detected'; 
      recommendation = 'Investigate potential causes';
    } else {
      prediction = 'Stable conditions';
      recommendation = 'Continue regular monitoring';
    }

    if (isAnomalous) {
      recommendation = 'ALERT: Values outside optimal range - immediate attention required';
    }

    return {
      direction,
      percentage: Math.abs(change),
      isAnomalous,
      prediction,
      recommendation
    };
  }, [data, config]);

  // Export functions
  const exportToExcel = () => {
    const exportData = data.map(d => ({
      Timestamp: new Date(d.timestamp).toLocaleString(),
      [config.name]: d.value,
      Unit: config.unit,
      Status: getThresholdStatus(d.value)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${config.name}_Data`);
    XLSX.writeFile(wb, `${config.name}_${timeRange}_Report.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`${config.name} Sensor Report`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Time Range: ${timeRange}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
    
    // Trend Analysis
    doc.setFontSize(14);
    doc.text('Trend Analysis', 14, 58);
    doc.setFontSize(10);
    doc.text(`Direction: ${trendAnalysis.direction.toUpperCase()} (${trendAnalysis.percentage.toFixed(2)}%)`, 14, 68);
    doc.text(`Prediction: ${trendAnalysis.prediction}`, 14, 76);
    doc.text(`Recommendation: ${trendAnalysis.recommendation || 'None'}`, 14, 84);
    
    // Threshold Information
    doc.setFontSize(14);
    doc.text('Thresholds', 14, 100);
    config.thresholds.forEach((threshold, index) => {
      doc.setFontSize(10);
      doc.text(`${threshold.label}: ${threshold.value}${config.unit} (${threshold.type})`, 14, 110 + (index * 8));
    });

    // Data Table
    const tableData = data.slice(-20).map(d => [
      new Date(d.timestamp).toLocaleString(),
      `${d.value}${config.unit}`,
      getThresholdStatus(d.value)
    ]);

    autoTable(doc, {
      head: [['Timestamp', config.name, 'Status']],
      body: tableData,
      startY: 130,
      styles: { fontSize: 8 }
    });

    doc.save(`${config.name}_${timeRange}_Report.pdf`);
  };

  const getThresholdStatus = (value: number): string => {
    for (const threshold of config.thresholds) {
      if (threshold.type === 'critical' && (value > threshold.value || value < threshold.value)) {
        return 'CRITICAL';
      }
      if (threshold.type === 'warning' && (value > threshold.value || value < threshold.value)) {
        return 'WARNING';
      }
    }
    return 'NORMAL';
  };

  const getTrendIcon = () => {
    switch (trendAnalysis.direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const chartConfig = {
    value: { 
      label: config.name, 
      color: "hsl(var(--chart-1))" 
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {timeRangeSelector}
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileText className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
        <CardDescription>{config.description || `${config.name} monitoring over ${timeRange}`}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status & Trend */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon()}
              <h4 className="font-medium">Trend Analysis</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {trendAnalysis.prediction} 
              {trendAnalysis.percentage > 0 && ` (${trendAnalysis.percentage.toFixed(2)}% change)`}
            </p>
            {trendAnalysis.recommendation && (
              <p className={`text-xs mt-1 ${trendAnalysis.isAnomalous ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                {trendAnalysis.recommendation}
              </p>
            )}
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              <h4 className="font-medium">Current Reading</h4>
            </div>
            <div className="text-2xl font-bold text-primary">
              {data[data.length - 1]?.value.toFixed(2) || 0}{config.unit}
            </div>
            <Badge 
              variant={trendAnalysis.isAnomalous ? "destructive" : "default"}
              className="mt-1"
            >
              {getThresholdStatus(data[data.length - 1]?.value || 0)}
            </Badge>
          </div>
        </div>

        {/* Chart with Thresholds */}
        <div className="h-[400px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  label={{ value: config.unit, angle: -90, position: 'insideLeft' }}
                  domain={config.yAxisRange ? [config.yAxisRange.min, config.yAxisRange.max] : ['auto', 'auto']}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                
                {/* Threshold Lines */}
                {config.thresholds.map((threshold, index) => (
                  <ReferenceLine
                    key={index}
                    y={threshold.value}
                    stroke={threshold.color}
                    strokeDasharray="5 5"
                    label={{
                      value: threshold.label,
                      position: "top"
                    }}
                  />
                ))}
                
                {/* Optimal Range */}
                {config.optimalRange && (
                  <>
                    <ReferenceLine
                      y={config.optimalRange.min}
                      stroke="green"
                      strokeDasharray="2 2"
                      label={{ value: "Min Optimal", position: "left" }}
                    />
                    <ReferenceLine
                      y={config.optimalRange.max}
                      stroke="green"
                      strokeDasharray="2 2"
                      label={{ value: "Max Optimal", position: "right" }}
                    />
                  </>
                )}
                
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Threshold Legend */}
        <div className="flex flex-wrap gap-2">
          {config.thresholds.map((threshold, index) => (
            <Badge key={index} variant="outline" style={{ borderColor: threshold.color }}>
              {threshold.label}: {threshold.value}{config.unit}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { EnhancedSensorChart };
export type { SensorConfig, ThresholdConfig, DataPoint };