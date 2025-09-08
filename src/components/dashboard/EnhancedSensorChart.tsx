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
import { useMemo, useState, useEffect } from "react";
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
  // Window size hook for responsive design
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive chart configuration
  const responsiveConfig = useMemo(() => {
    const isMobile = windowSize.width < 640;
    const isTablet = windowSize.width >= 640 && windowSize.width < 1024;
    const isDesktop = windowSize.width >= 1024;
    
    return {
      margins: {
        top: isMobile ? 40 : isTablet ? 50 : 60,
        right: isMobile ? 20 : isTablet ? 30 : 40,
        left: isMobile ? 30 : isTablet ? 40 : 50,
        bottom: isMobile ? 60 : isTablet ? 80 : 100
      },
      fontSize: isMobile ? 10 : isTablet ? 11 : 12,
      tickHeight: isMobile ? 50 : isTablet ? 65 : 80,
      xAxisInterval: isMobile ? ('preserveStartEnd' as const) : (0 as const),
      xAxisAngle: isMobile ? -45 : 0,
      textAnchor: isMobile ? ('end' as const) : ('middle' as const),
      precision: isMobile ? 1 : 2,
      labelOffset: isDesktop ? 15 : isTablet ? 10 : 5
    };
  }, [windowSize.width]);

  // Extract critical thresholds for consistent use
  const criticalThresholds = useMemo(() => {
    return config.thresholds.filter(t => t.type === 'critical');
  }, [config.thresholds]);
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
        <div className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] p-2 sm:p-4">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data} 
                margin={responsiveConfig.margins}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: responsiveConfig.fontSize }}
                  height={responsiveConfig.tickHeight}
                  interval={responsiveConfig.xAxisInterval}
                  angle={responsiveConfig.xAxisAngle}
                  textAnchor={responsiveConfig.textAnchor}
                />
                <YAxis 
                  label={{ 
                    value: config.unit, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: responsiveConfig.fontSize }
                  }}
                  domain={config.yAxisRange ? [config.yAxisRange.min, config.yAxisRange.max] : ['auto', 'auto']}
                  tickFormatter={(value) => value.toFixed(responsiveConfig.precision)}
                  tick={{ fontSize: responsiveConfig.fontSize }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, '']} />}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                
                {/* Threshold Lines */}
                {criticalThresholds.map((threshold, index) => (
                  <ReferenceLine
                    key={index}
                    y={threshold.value}
                    stroke={threshold.color}
                    strokeDasharray="5 5"
                    label={{
                      value: `${threshold.label}: ${threshold.value.toFixed(2)}${config.unit}`,
                      position: "insideTopRight",
                      offset: responsiveConfig.labelOffset,
                      style: { 
                        textAnchor: 'end',
                        fontSize: `${responsiveConfig.fontSize}px`,
                        fill: threshold.color,
                        fontWeight: 'bold',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }
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
                      label={{ 
                        value: `Min Optimal: ${config.optimalRange.min.toFixed(2)}${config.unit}`, 
                        position: "center",
                        style: { 
                          textAnchor: 'middle',
                          fontSize: '12px',
                          fill: 'green',
                          fontWeight: 'bold',
                          background: 'white',
                          border: '1px solid #ccc',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }
                      }}
                    />
                    <ReferenceLine
                      y={config.optimalRange.max}
                      stroke="green"
                      strokeDasharray="2 2"
                      label={{ 
                        value: `Max Optimal: ${config.optimalRange.max.toFixed(2)}${config.unit}`, 
                        position: "center",
                        style: { 
                          textAnchor: 'middle',
                          fontSize: '12px',
                          fill: 'green',
                          fontWeight: 'bold',
                          background: 'white',
                          border: '1px solid #ccc',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }
                      }}
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

        {/* Critical Thresholds */}
        <div className="flex flex-wrap gap-3 justify-center">
          {criticalThresholds.map((threshold, index) => (
            <Badge 
              key={index} 
              variant={threshold.label.toLowerCase().includes('low') ? 'default' : 'destructive'}
              className={`px-4 py-2 text-sm font-medium ${
                threshold.label.toLowerCase().includes('low') 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-red-500 bg-red-50 text-red-700'
              }`}
            >
              {threshold.label}: {threshold.value.toFixed(2)}{config.unit}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { EnhancedSensorChart };
export type { SensorConfig, ThresholdConfig, DataPoint };