import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AQIData {
  aqi: number;
  city: string;
  dominantPollutant: string;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  time: string;
  temperature: number;
  humidity: number;
}

const SingaporeAQICard = () => {
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAQIData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('get-singapore-aqi');
        
        if (error) {
          throw new Error(error.message);
        }
        
        setAqiData(data);
      } catch (err) {
        console.error('Error fetching AQI data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch AQI data');
      } finally {
        setLoading(false);
      }
    };

    fetchAQIData();
    
    // Update every 30 minutes
    const interval = setInterval(fetchAQIData, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getAQILevel = (aqi: number) => {
    if (aqi <= 50) return { 
      level: "Good", 
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Air quality is satisfactory"
    };
    if (aqi <= 100) return { 
      level: "Moderate", 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      description: "Air quality is acceptable for most people"
    };
    if (aqi <= 150) return { 
      level: "Unhealthy for Sensitive Groups", 
      color: "bg-orange-100 text-orange-800 border-orange-200",
      description: "Members of sensitive groups may experience health effects"
    };
    if (aqi <= 200) return { 
      level: "Unhealthy", 
      color: "bg-red-100 text-red-800 border-red-200",
      description: "Everyone may begin to experience health effects"
    };
    return { 
      level: "Hazardous", 
      color: "bg-purple-100 text-purple-800 border-purple-200",
      description: "Health alert: everyone may experience serious health effects"
    };
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading Singapore AQI data...</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !aqiData) {
    return (
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <h4 className="font-medium text-warning">Unable to fetch Singapore AQI data</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || "Please check your internet connection and try again"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aqiInfo = getAQILevel(aqiData.aqi);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Main AQI Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{aqiData.city || "Singapore"}</span>
            </div>
            <Badge variant="outline" className={aqiInfo.color}>
              {aqiInfo.level}
            </Badge>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary mb-2">{aqiData.aqi}</div>
            <p className="text-sm text-muted-foreground">Air Quality Index</p>
            <Progress 
              value={Math.min((aqiData.aqi / 300) * 100, 100)} 
              className="mt-3"
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated: {new Date(aqiData.time).toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Dominant Pollutant */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-3">Primary Pollutant</h4>
          <div className="text-2xl font-bold text-primary mb-2">
            {aqiData.dominantPollutant || "PM2.5"}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Main contributor to current air quality
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>PM2.5:</span>
              <span className="font-medium">{aqiData.pm25 || 0} μg/m³</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>PM10:</span>
              <span className="font-medium">{aqiData.pm10 || 0} μg/m³</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Advisory */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {aqiData.aqi <= 100 ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            <h4 className="font-medium">Health Advisory</h4>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {aqiInfo.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Temperature:</span>
              <span className="font-medium">{aqiData.temperature || 0}°C</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Humidity:</span>
              <span className="font-medium">{aqiData.humidity || 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SingaporeAQICard };