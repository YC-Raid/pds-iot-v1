import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowLeft, Activity, Thermometer, Droplets, Gauge, Zap, Eye, Cloud, Wind, Waves } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CustomTooltip } from "@/components/ui/custom-chart-tooltip";

const SensorDetail = () => {
  const { sensorType } = useParams();
  const navigate = useNavigate();
  const { getSensorReadingsByTimeRange } = useSensorData();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Static test data as fallback
  const testData = [
    { time: "10:00", value: 25.5, x_axis: 1.2, y_axis: -0.8, z_axis: 9.8, magnitude: 9.9 },
    { time: "10:05", value: 26.1, x_axis: 1.1, y_axis: -0.9, z_axis: 9.7, magnitude: 9.8 },
    { time: "10:10", value: 25.8, x_axis: 1.3, y_axis: -0.7, z_axis: 9.9, magnitude: 10.0 },
    { time: "10:15", value: 26.3, x_axis: 1.0, y_axis: -1.0, z_axis: 9.6, magnitude: 9.7 },
    { time: "10:20", value: 25.9, x_axis: 1.4, y_axis: -0.6, z_axis: 10.0, magnitude: 10.1 }
  ];

  const sensorConfig = {
    temperature: { name: "Temperature Sensor", icon: Thermometer, unit: "°C", dataKey: "temperature" },
    humidity: { name: "Humidity Sensor", icon: Droplets, unit: "%", dataKey: "humidity" },
    pressure: { name: "Pressure Sensor", icon: Gauge, unit: "hPa", dataKey: "pressure" },
    gas: { name: "Gas Quality Sensor", icon: Zap, unit: "Ω", dataKey: "gas_resistance" },
    pm1: { name: "PM1.0 Monitor", icon: Eye, unit: "μg/m³", dataKey: "pm1_0" },
    pm25: { name: "PM2.5 Monitor", icon: Cloud, unit: "μg/m³", dataKey: "pm2_5" },
    pm10: { name: "PM10 Monitor", icon: Wind, unit: "μg/m³", dataKey: "pm10" },
    acceleration: { name: "Accelerometer", icon: Activity, unit: "m/s²", dataKey: "accel" },
    rotation: { name: "Gyroscope", icon: Waves, unit: "°/s", dataKey: "gyro" }
  };

  const currentSensor = sensorConfig[sensorType] || sensorConfig.temperature;
  const IconComponent = currentSensor.icon;

  useEffect(() => {
    console.log(`🔥 SensorDetail page loaded for: ${sensorType}`);
    
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load real sensor data
        const data = await getSensorReadingsByTimeRange(24);
        console.log(`📊 Fetched ${data.length} records for ${sensorType}`);
        
        if (data.length > 0) {
          let formatted = [];
          
          if (sensorType === 'acceleration') {
            formatted = data.slice(-50).map(reading => ({
              time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', minute: '2-digit', hour12: false 
              }),
              x_axis: Number(reading.accel_x) || 0,
              y_axis: Number(reading.accel_y) || 0, 
              z_axis: Number(reading.accel_z) || 0,
              magnitude: Number(reading.accel_magnitude) || 0
            }));
          } else if (sensorType === 'rotation') {
            formatted = data.slice(-50).map(reading => ({
              time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', minute: '2-digit', hour12: false 
              }),
              x_axis: Number(reading.gyro_x) || 0,
              y_axis: Number(reading.gyro_y) || 0,
              z_axis: Number(reading.gyro_z) || 0, 
              magnitude: Number(reading.gyro_magnitude) || 0
            }));
          } else {
            // Single value sensors
            const dataKey = currentSensor.dataKey;
            formatted = data.slice(-50).map(reading => ({
              time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', minute: '2-digit', hour12: false 
              }),
              value: Number(reading[dataKey]) || 0
            }));
          }
          
          console.log(`✅ Formatted ${formatted.length} data points`);
          setChartData(formatted);
        } else {
          console.warn('⚠️ No data available, using test data');
          setChartData(testData);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setChartData(testData); // Fallback to test data
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sensorType, getSensorReadingsByTimeRange, currentSensor.dataKey]);

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/?tab=sensors')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Sensors
              </Button>
              <div className="flex items-center gap-3">
                <IconComponent className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{currentSensor.name}</CardTitle>
                  <CardDescription>Hangar 01 • Real-time Analysis</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{sensorType} Data - Last 24 Hours</CardTitle>
            <CardDescription>Historical readings and trends ({chartData.length} data points)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading sensor data...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip sensorType={sensorType} />} />
                    
                    {(sensorType === 'acceleration' || sensorType === 'rotation') ? (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="x_axis" 
                          stroke="hsl(var(--chart-1))" 
                          strokeWidth={2} 
                          name="X-Axis"
                          dot={false}
                          activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="y_axis" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2} 
                          name="Y-Axis"
                          dot={false}
                          activeDot={{ r: 4, fill: "hsl(var(--chart-2))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="z_axis" 
                          stroke="hsl(var(--chart-3))" 
                          strokeWidth={2} 
                          name="Z-Axis"
                          dot={false}
                          activeDot={{ r: 4, fill: "hsl(var(--chart-3))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="magnitude" 
                          stroke="hsl(var(--chart-4))" 
                          strokeWidth={3} 
                          strokeDasharray="5 5"
                          name="Magnitude"
                          dot={false}
                          activeDot={{ r: 5, fill: "hsl(var(--chart-4))" }}
                        />
                      </>
                    ) : (
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: "hsl(var(--chart-1))" }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Values */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Current Readings</CardTitle>
              <CardDescription>Latest sensor values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {(sensorType === 'acceleration' || sensorType === 'rotation') ? (
                  <>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-1">
                        {chartData[chartData.length - 1]?.x_axis?.toFixed(3) || "0.000"}
                      </div>
                      <div className="text-sm text-muted-foreground">X-Axis ({currentSensor.unit})</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-2">
                        {chartData[chartData.length - 1]?.y_axis?.toFixed(3) || "0.000"}
                      </div>
                      <div className="text-sm text-muted-foreground">Y-Axis ({currentSensor.unit})</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-3">
                        {chartData[chartData.length - 1]?.z_axis?.toFixed(3) || "0.000"}
                      </div>
                      <div className="text-sm text-muted-foreground">Z-Axis ({currentSensor.unit})</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-4">
                        {chartData[chartData.length - 1]?.magnitude?.toFixed(3) || "0.000"}
                      </div>
                      <div className="text-sm text-muted-foreground">Magnitude ({currentSensor.unit})</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-chart-1">
                      {chartData[chartData.length - 1]?.value?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-muted-foreground">Current {currentSensor.name} ({currentSensor.unit})</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SensorDetail;