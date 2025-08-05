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

// Priority mapping for different alert types
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
            status: 'active'
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
            status: 'active'
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
          status: 'active'
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