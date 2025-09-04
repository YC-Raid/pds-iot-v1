import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Activity,
  ArrowLeft,
  Download,
  Share
} from "lucide-react";
import { QRCodeGenerator } from "@/components/ui/qr-code-generator";
import { SEO } from "@/components/seo/SEO";
import { JsonLd } from "@/components/seo/JsonLd";

interface AlertData {
  id: string;
  title: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  sensorType: string;
  sensorId: string;
  value: number;
  threshold: number;
  unit: string;
  location: string;
  timestamp: string;
  resolved: boolean;
}

const mockAlertData: AlertData = {
  id: "ALERT-001",
  title: "Critical Temperature Threshold Exceeded",
  type: "critical",
  message: "Temperature sensor TempSensor-003 has exceeded critical threshold",
  sensorType: "Temperature",
  sensorId: "TempSensor-003",
  value: 45.2,
  threshold: 40.0,
  unit: "°C",
  location: "Zone A - Storage Bay 3",
  timestamp: "2024-01-15T14:30:00Z",
  resolved: false
};

export default function CriticalAlert() {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // In real implementation, fetch alert data by alertId
    setAlertData(mockAlertData);
  }, [alertId]);

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info': return <Activity className="h-5 w-5 text-info" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'humidity': return <Droplets className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const currentUrl = window.location.href;

  if (!alertData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SEO title={`Alert – ${alertData.title}`} description={`Details for ${alertData.sensorType} alert`} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Alert – ${alertData.title}`,
        description: `Details for ${alertData.sensorType} alert`,
        url: window.location.href
      }} />
      <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/?tab=alerts")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowQR(!showQR)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Critical Alert Banner */}
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-lg font-semibold">
            CRITICAL ALERT - Immediate Action Required
          </AlertDescription>
        </Alert>

        {/* Main Alert Details */}
        <Card className="relative">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSeverityIcon(alertData.type)}
                <div>
                  <CardTitle className="text-xl">{alertData.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    {new Date(alertData.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getSeverityColor(alertData.type) as any} className="text-sm">
                {alertData.type.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alert Message */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Alert Message</p>
              <p className="font-medium">{alertData.message}</p>
            </div>

            {/* Sensor Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getSensorIcon(alertData.sensorType)}
                    Sensor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sensor ID:</span>
                    <span className="font-mono">{alertData.sensorId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{alertData.sensorType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alertData.location}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Reading Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className="font-bold text-destructive">
                      {alertData.value} {alertData.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Threshold:</span>
                    <span>{alertData.threshold} {alertData.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exceeded By:</span>
                    <span className="font-bold text-destructive">
                      +{(alertData.value - alertData.threshold).toFixed(2)} {alertData.unit}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Section */}
            {showQR && (
              <Card>
                <CardHeader>
                  <CardTitle>Share This Alert</CardTitle>
                  <CardDescription>
                    Scan QR code or share URL to view this alert on mobile devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QRCodeGenerator 
                    url={currentUrl}
                    title={`Alert: ${alertData.title}`}
                    description={`${alertData.sensorType} sensor ${alertData.sensorId} exceeded threshold`}
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button className="bg-destructive hover:bg-destructive/90">
                Acknowledge Alert
              </Button>
              <Button variant="outline">
                View Sensor History
              </Button>
              <Button variant="outline">
                Schedule Maintenance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}