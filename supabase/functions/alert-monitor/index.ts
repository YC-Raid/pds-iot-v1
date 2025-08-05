import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SensorData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  air_quality?: number;
  vibration?: number;
  sensor_location?: string;
  timestamp?: string;
}

// Priority mapping and impact generation for different alert types
const getPriorityAndType = (alertCategory: string, value: number, threshold: number): { priority: 'P1' | 'P2' | 'P3' | 'P4', type: 'error' | 'warning' | 'info' } => {
  if (alertCategory === 'vibration' && value > 15) {
    return { priority: 'P1', type: 'error' }; // Critical - immediate attention
  } else if (alertCategory === 'vibration' && value > 10) {
    return { priority: 'P2', type: 'warning' }; // High - urgent attention
  } else if (alertCategory === 'temperature' && value > threshold + 10) {
    return { priority: 'P2', type: 'warning' }; // High temperature variance
  } else if (alertCategory === 'humidity' && value > threshold + 15) {
    return { priority: 'P2', type: 'warning' }; // High humidity variance
  } else if ((alertCategory === 'temperature' || alertCategory === 'humidity') && value > threshold) {
    return { priority: 'P3', type: 'warning' }; // Standard threshold exceeded
  } else {
    return { priority: 'P4', type: 'info' }; // Low priority informational
  }
};

// Generate automatic impact assessment based on sensor type and severity
const generateImpact = (alertCategory: string, value: number, threshold: number, priority: string): string => {
  const variance = value - threshold;
  
  switch (alertCategory) {
    case 'temperature':
      if (priority === 'P1') {
        return 'CRITICAL: Equipment overheating risk, potential fire hazard, immediate shutdown required to prevent damage';
      } else if (priority === 'P2') {
        return `High temperature detected (${variance.toFixed(1)}°C above threshold). Risk of equipment degradation, reduced lifespan, and potential thermal damage`;
      } else if (priority === 'P3') {
        return `Moderate temperature elevation. May cause accelerated wear, reduced efficiency, and increased maintenance needs`;
      }
      return 'Minor temperature variance. Monitor for trends and potential equipment stress';
      
    case 'humidity':
      if (priority === 'P1') {
        return 'CRITICAL: Extreme humidity levels pose corrosion risk, electrical hazards, and material degradation. Immediate environmental control required';
      } else if (priority === 'P2') {
        return `High humidity detected (${variance.toFixed(1)}% above threshold). Risk of corrosion, mold growth, electrical issues, and equipment malfunction`;
      } else if (priority === 'P3') {
        return `Elevated humidity levels. May cause condensation, reduced air quality, and gradual equipment deterioration`;
      }
      return 'Minor humidity variance. Monitor for environmental control system performance';
      
    case 'vibration':
      if (priority === 'P1') {
        return `CRITICAL: Dangerous vibration levels (${value} units) indicate potential mechanical failure, bearing damage, or structural issues. IMMEDIATE INSPECTION REQUIRED`;
      } else if (priority === 'P2') {
        return `High vibration detected (${value} units). Risk of mechanical wear, component loosening, and eventual equipment failure if not addressed`;
      } else if (priority === 'P3') {
        return `Elevated vibration levels. May indicate developing mechanical issues, misalignment, or need for maintenance`;
      }
      return 'Minor vibration variance. Normal operational fluctuation, continue monitoring';
      
    case 'pressure':
      if (priority === 'P1') {
        return 'CRITICAL: Extreme pressure variance poses safety risk, potential system rupture, and equipment damage';
      } else if (priority === 'P2') {
        return 'High pressure variance detected. Risk of system stress, seal failure, and performance degradation';
      }
      return 'Moderate pressure variance. Monitor for system efficiency and potential maintenance needs';
      
    case 'air_quality':
      if (priority === 'P1') {
        return 'CRITICAL: Poor air quality poses health risks and equipment contamination. Immediate air filtration and ventilation required';
      } else if (priority === 'P2') {
        return 'Poor air quality detected. Risk of respiratory issues, equipment contamination, and reduced operational efficiency';
      }
      return 'Air quality variance detected. Monitor ventilation systems and filter maintenance schedules';
      
    default:
      return 'Impact assessment required. Monitor for operational changes and potential safety implications';
  }
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sensorData: SensorData = await req.json();
    console.log('Received sensor data:', sensorData);

    // Get all users' notification settings to check alert thresholds
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_id, alert_threshold_temp, alert_threshold_humidity, email_enabled');

    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      throw new Error('Failed to fetch notification settings');
    }

    const alerts = [];
    const dbAlerts = [];

    // Check temperature alerts
    if (sensorData.temperature !== undefined) {
      for (const setting of settings) {
        if (sensorData.temperature > setting.alert_threshold_temp) {
          const { priority, type } = getPriorityAndType('temperature', sensorData.temperature, setting.alert_threshold_temp);
          const shouldEmailP1P2 = (priority === 'P1' || priority === 'P2') && setting.email_enabled;
          
          const alertData = {
            user_id: setting.user_id,
            title: `${priority} Temperature Alert`,
            message: `Temperature reading of ${sensorData.temperature}°C exceeds threshold of ${setting.alert_threshold_temp}°C at ${sensorData.sensor_location || 'unknown location'}`,
            type: type,
            send_email: shouldEmailP1P2
          };
          
          alerts.push(alertData);
          
          // Create alert in database
          dbAlerts.push({
            title: alertData.title,
            description: alertData.message,
            priority: priority,
            sensor_type: 'temperature',
            sensor_location: sensorData.sensor_location || 'Unknown',
            sensor_value: sensorData.temperature,
            threshold_value: setting.alert_threshold_temp,
            status: 'active',
            severity: priority === 'P1' ? 'critical' : priority === 'P2' ? 'high' : 'medium',
            category: 'environmental',
            equipment: 'Temperature Sensor',
            location: sensorData.sensor_location || 'Unknown',
            sensor: `Temp-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
            value: sensorData.temperature.toString(),
            threshold: setting.alert_threshold_temp.toString(),
            unit: '°C',
            impact: generateImpact('temperature', sensorData.temperature, setting.alert_threshold_temp, priority)
          });
        }
      }
    }

    // Check humidity alerts
    if (sensorData.humidity !== undefined) {
      for (const setting of settings) {
        if (sensorData.humidity > setting.alert_threshold_humidity) {
          const { priority, type } = getPriorityAndType('humidity', sensorData.humidity, setting.alert_threshold_humidity);
          const shouldEmailP1P2 = (priority === 'P1' || priority === 'P2') && setting.email_enabled;
          
          const alertData = {
            user_id: setting.user_id,
            title: `${priority} Humidity Alert`,
            message: `Humidity reading of ${sensorData.humidity}% exceeds threshold of ${setting.alert_threshold_humidity}% at ${sensorData.sensor_location || 'unknown location'}`,
            type: type,
            send_email: shouldEmailP1P2
          };
          
          alerts.push(alertData);
          
          // Create alert in database
          dbAlerts.push({
            title: alertData.title,
            description: alertData.message,
            priority: priority,
            sensor_type: 'humidity',
            sensor_location: sensorData.sensor_location || 'Unknown',
            sensor_value: sensorData.humidity,
            threshold_value: setting.alert_threshold_humidity,
            status: 'active',
            severity: priority === 'P1' ? 'critical' : priority === 'P2' ? 'high' : 'medium',
            category: 'environmental',
            equipment: 'Humidity Sensor',
            location: sensorData.sensor_location || 'Unknown',
            sensor: `Hum-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
            value: sensorData.humidity.toString(),
            threshold: setting.alert_threshold_humidity.toString(),
            unit: '%',
            impact: generateImpact('humidity', sensorData.humidity, setting.alert_threshold_humidity, priority)
          });
        }
      }
    }

    // Check vibration alerts (critical threshold)
    if (sensorData.vibration !== undefined && sensorData.vibration > 10) {
      for (const setting of settings) {
        const { priority, type } = getPriorityAndType('vibration', sensorData.vibration, 10);
        const shouldEmailP1P2 = (priority === 'P1' || priority === 'P2') && setting.email_enabled;
        
        const alertData = {
          user_id: setting.user_id,
          title: `${priority} Vibration Alert`,
          message: `Dangerous vibration level detected: ${sensorData.vibration} units at ${sensorData.sensor_location || 'unknown location'}. ${priority === 'P1' ? 'IMMEDIATE INSPECTION REQUIRED!' : 'Urgent inspection required.'}`,
          type: type,
          send_email: shouldEmailP1P2
        };
        
        alerts.push(alertData);
        
        // Create alert in database
        dbAlerts.push({
          title: alertData.title,
          description: alertData.message,
          priority: priority,
          sensor_type: 'vibration',
          sensor_location: sensorData.sensor_location || 'Unknown',
          sensor_value: sensorData.vibration,
          threshold_value: 10,
          status: 'active',
          severity: priority === 'P1' ? 'critical' : priority === 'P2' ? 'high' : 'medium',
          category: 'equipment',
          equipment: 'Vibration Sensor',
          location: sensorData.sensor_location || 'Unknown',
          sensor: `Vib-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
          value: sensorData.vibration.toString(),
          threshold: '10',
          unit: 'units',
          impact: generateImpact('vibration', sensorData.vibration, 10, priority)
        });
      }
    }

    // Insert alerts into database
    if (dbAlerts.length > 0) {
      console.log(`Creating ${dbAlerts.length} alerts in database...`);
      const { error: alertError } = await supabase
        .from('alerts')
        .insert(dbAlerts);
      
      if (alertError) {
        console.error('Error creating alerts in database:', alertError);
      } else {
        console.log('Successfully created alerts in database');
      }
    }

    // Send alerts through notification service
    if (alerts.length > 0) {
      console.log(`Sending ${alerts.length} alerts...`);
      
      for (const alert of alerts) {
        try {
          const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify(alert),
          });

          if (!notificationResponse.ok) {
            console.error('Failed to send notification:', await notificationResponse.text());
          }
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_triggered: alerts.length,
        message: 'Sensor data processed successfully'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in alert-monitor function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);