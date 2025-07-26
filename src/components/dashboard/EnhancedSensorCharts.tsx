
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Droplets, 
  Wind,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

const EnhancedSensorCharts = () => {
  // Extended historical + predicted data
  const temperatureData = [
    // Historical data (past 24 hours)
    { time: "00:00", value: 21.2, type: "historical", prediction: null },
    { time: "04:00", value: 20.8, type: "historical", prediction: null },
    { time: "08:00", value: 22.1, type: "historical", prediction: null },
    { time: "12:00", value: 24.5, type: "historical", prediction: null },
    { time: "16:00", value: 23.8, type: "historical", prediction: null },
    { time: "20:00", value: 22.5, type: "historical", prediction: null },
    { time: "24:00", value: 22.0, type: "current", prediction: null },
    // Predicted data (next 24 hours)
    { time: "28:00", value: null, type: "predicted", prediction: 21.8 },
    { time: "32:00", value: null, type: "predicted", prediction: 21.5 },
    { time: "36:00", value: null, type: "predicted", prediction: 22.2 },
    { time: "40:00", value: null, type: "predicted", prediction: 23.1 },
    { time: "44:00", value: null, type: "predicted", prediction: 23.8 },
    { time: "48:00", value: null, type: "predicted", prediction: 23.2 }
  ];

  const humidityData = [
    { time: "00:00", value: 68, type: "historical", prediction: null },
    { time: "04:00", value: 70, type: "historical", prediction: null },
    { time: "08:00", value: 65, type: "historical", prediction: null },
    { time: "12:00", value: 62, type: "historical", prediction: null },
    { time: "16:00", value: 64, type: "historical", prediction: null },
    { time: "20:00", value: 66, type: "historical", prediction: null },
    { time: "24:00", value: 65, type: "current", prediction: null },
    { time: "28:00", value: null, type: "predicted", prediction: 67 },
    { time: "32:00", value: null, type: "predicted", prediction: 69 },
    { time: "36:00", value: null, type: "predicted", prediction: 71 },
    { time: "40:00", value: null, type: "predicted", prediction: 68 },
    { time: "44:00", value: null, type: "predicted", prediction: 66 },
    { time: "48:00", value: null, type: "predicted", prediction: 64 }
  ];

  const airQualityData = [
    { time: "00:00", value: 82, type: "historical", prediction: null },
    { time: "04:00", value: 85, type: "historical", prediction: null },
    { time: "08:00", value: 88, type: "historical", prediction: null },
    { time: "12:00", value: 91, type: "historical", prediction: null },
    { time: "16:00", value: 87, type: "historical", prediction: null },
    { time: "20:00", value: 85, type: "historical", prediction: null },
    { time: "24:00", value: 85, type: "current", prediction: null },
    { time: "28:00", value: null, type: "predicted", prediction: 87 },
    { time: "32:00", value: null, type: "predicted", prediction: 89 },
    { time: "36:00", value: null, type: "predicted", prediction: 91 },
    { time: "40:00", value: null, type: "predicted", prediction: 88 },
    { time: "44:00", value: null, type: "predicted", prediction: 86 },
    { time: "48:00", value: null, type: "predicted", prediction: 84 }
  ];

  const chartConfigs = {
    temperature: {
      historical: { label: "Historical Temp (°C)", color: "#3b82f6" },
      predicted: { label: "Predicted Temp (°C)", color: "#93c5fd" }
    },
    humidity: {
      historical: { label: "Historical Humidity (%)", color: "#10b981" },
      predicted: { label: "Predicted Humidity (%)", color: "#86efac" }
    },
    airQuality: {
      historical: { label: "Historical AQI", color: "#f59e0b" },
      predicted: { label: "Predicted AQI", color: "#fbbf24" }
    }
  };

  const renderChart = (data: any[], config: any, title: string, icon: any, unit: string, threshold: string) => {
    const IconComponent = icon;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {title} Trends & Predictions
          </CardTitle>
          <CardDescription>
            Historical data (solid) + AI predictions (dashed) | Threshold: {threshold}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine x="24:00" stroke="#ef4444" strokeDasharray="2 2" />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={config.historical.color}
                  strokeWidth={2}
                  dot={{ fill: config.historical.color, strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="prediction" 
                  stroke={config.predicted.color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: config.predicted.color, strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Past 24h</span>
            <Badge variant="outline" className="text-red-600">Current Time</Badge>
            <span>Next 24h (Predicted)</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="humidity">Humidity</TabsTrigger>
          <TabsTrigger value="airquality">Air Quality</TabsTrigger>
        </TabsList>
        
        <TabsContent value="temperature" className="space-y-4">
          {renderChart(temperatureData, chartConfigs.temperature, "Temperature", Thermometer, "°C", "18-25°C")}
        </TabsContent>
        
        <TabsContent value="humidity" className="space-y-4">
          {renderChart(humidityData, chartConfigs.humidity, "Humidity", Droplets, "%", "<70%")}
        </TabsContent>
        
        <TabsContent value="airquality" className="space-y-4">
          {renderChart(airQualityData, chartConfigs.airQuality, "Air Quality", Wind, "AQI", ">80")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { EnhancedSensorCharts };
