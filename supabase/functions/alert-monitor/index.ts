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

    // Check temperature alerts
    if (sensorData.temperature !== undefined) {
      for (const setting of settings) {
        if (sensorData.temperature > setting.alert_threshold_temp) {
          alerts.push({
            user_id: setting.user_id,
            title: 'High Temperature Alert',
            message: `Temperature reading of ${sensorData.temperature}°C exceeds threshold of ${setting.alert_threshold_temp}°C at ${sensorData.sensor_location || 'unknown location'}`,
            type: 'warning',
            send_email: setting.email_enabled
          });
        }
      }
    }

    // Check humidity alerts
    if (sensorData.humidity !== undefined) {
      for (const setting of settings) {
        if (sensorData.humidity > setting.alert_threshold_humidity) {
          alerts.push({
            user_id: setting.user_id,
            title: 'High Humidity Alert',
            message: `Humidity reading of ${sensorData.humidity}% exceeds threshold of ${setting.alert_threshold_humidity}% at ${sensorData.sensor_location || 'unknown location'}`,
            type: 'warning',
            send_email: setting.email_enabled
          });
        }
      }
    }

    // Check vibration alerts (critical threshold)
    if (sensorData.vibration !== undefined && sensorData.vibration > 10) {
      for (const setting of settings) {
        alerts.push({
          user_id: setting.user_id,
          title: 'Critical Vibration Alert',
          message: `Dangerous vibration level detected: ${sensorData.vibration} units at ${sensorData.sensor_location || 'unknown location'}. Immediate inspection required!`,
          type: 'error',
          send_email: setting.email_enabled
        });
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