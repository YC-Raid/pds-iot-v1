import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ArrowLeft, Activity, Thermometer, Droplets, Gauge, Zap, Eye, Cloud, Wind, Waves } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SensorDetail = () => {
  const { sensorType } = useParams();
  const navigate = useNavigate();
  const { getSensorReadingsByTimeRange } = useSensorData();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Static test data to verify chart rendering
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
        // For debugging, let's use test data first
        console.log(`📊 Using test data for ${sensorType}`);
        setChartData(testData);
        
        // Uncomment below to use real data once test works
        /*
        const data = await getSensorReadingsByTimeRange(24);
        console.log(`📊 Fetched ${data.length} records`);
        
        if (data.length > 0) {
          const formatted = data.slice(-20).map(reading => ({
            time: new Date(reading.recorded_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', minute: '2-digit', hour12: false 
            }),
            value: Number(reading[currentSensor.dataKey]) || 0,
            x_axis: Number(reading.accel_x) || 0,
            y_axis: Number(reading.accel_y) || 0,
            z_axis: Number(reading.accel_z) || 0,
            magnitude: Number(reading.accel_magnitude) || 0
          }));
          setChartData(formatted);
        }
        */
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setChartData(testData); // Fallback to test data
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sensorType]);

  return (
    <div className="min-h-screen bg-background p-6">
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
            <CardDescription>Historical readings and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading data...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    
                    {(sensorType === 'acceleration' || sensorType === 'rotation') ? (
                      <>
                        <Line type="monotone" dataKey="x_axis" stroke="#8884d8" name="X-Axis" />
                        <Line type="monotone" dataKey="y_axis" stroke="#82ca9d" name="Y-Axis" />
                        <Line type="monotone" dataKey="z_axis" stroke="#ffc658" name="Z-Axis" />
                        <Line type="monotone" dataKey="magnitude" stroke="#ff7c7c" strokeWidth={3} name="Magnitude" />
                      </>
                    ) : (
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Sensor Type:</strong> {sensorType}</p>
              <p><strong>Data Points:</strong> {chartData.length}</p>
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Sample Data:</strong> {JSON.stringify(chartData[0] || {}, null, 2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SensorDetail;