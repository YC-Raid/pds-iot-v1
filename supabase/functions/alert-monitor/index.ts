import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Input validation helpers
const isValidNumber = (val: unknown, min: number, max: number): val is number => {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max;
};

const isValidString = (val: unknown, maxLength: number): val is string => {
  return typeof val === 'string' && val.length <= maxLength;
};

const sanitizeLocation = (location: unknown): string => {
  if (typeof location !== 'string') return 'Unknown';
  // Only allow alphanumeric, spaces, underscores, and hyphens
  const sanitized = location.replace(/[^a-zA-Z0-9\s_-]/g, '').substring(0, 100);
  return sanitized || 'Unknown';
};

interface SensorData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  air_quality?: number;
  vibration?: number;
  sensor_location?: string;
  timestamp?: string;
  accel_x?: number;
  accel_y?: number;
  accel_z?: number;
}

// Validate sensor data with reasonable ranges
const validateSensorData = (data: unknown): { valid: boolean; data?: SensorData; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const sensorData = data as Record<string, unknown>;
  const validated: SensorData = {};

  // Validate temperature (-50°C to 100°C)
  if (sensorData.temperature !== undefined) {
    if (!isValidNumber(sensorData.temperature, -50, 100)) {
      return { valid: false, error: 'Temperature must be between -50 and 100' };
    }
    validated.temperature = sensorData.temperature;
  }

  // Validate humidity (0% to 100%)
  if (sensorData.humidity !== undefined) {
    if (!isValidNumber(sensorData.humidity, 0, 100)) {
      return { valid: false, error: 'Humidity must be between 0 and 100' };
    }
    validated.humidity = sensorData.humidity;
  }

  // Validate pressure (800 to 1200 hPa)
  if (sensorData.pressure !== undefined) {
    if (!isValidNumber(sensorData.pressure, 800, 1200)) {
      return { valid: false, error: 'Pressure must be between 800 and 1200 hPa' };
    }
    validated.pressure = sensorData.pressure;
  }

  // Validate vibration (0 to 100 m/s²)
  if (sensorData.vibration !== undefined) {
    if (!isValidNumber(sensorData.vibration, 0, 100)) {
      return { valid: false, error: 'Vibration must be between 0 and 100' };
    }
    validated.vibration = sensorData.vibration;
  }

  // Validate accelerometer values (-100 to 100 m/s²)
  if (sensorData.accel_x !== undefined) {
    if (!isValidNumber(sensorData.accel_x, -100, 100)) {
      return { valid: false, error: 'Accelerometer X must be between -100 and 100' };
    }
    validated.accel_x = sensorData.accel_x;
  }

  if (sensorData.accel_y !== undefined) {
    if (!isValidNumber(sensorData.accel_y, -100, 100)) {
      return { valid: false, error: 'Accelerometer Y must be between -100 and 100' };
    }
    validated.accel_y = sensorData.accel_y;
  }

  if (sensorData.accel_z !== undefined) {
    if (!isValidNumber(sensorData.accel_z, -100, 100)) {
      return { valid: false, error: 'Accelerometer Z must be between -100 and 100' };
    }
    validated.accel_z = sensorData.accel_z;
  }

  // Validate and sanitize sensor_location
  validated.sensor_location = sanitizeLocation(sensorData.sensor_location);

  // Validate timestamp if provided
  if (sensorData.timestamp !== undefined) {
    if (!isValidString(sensorData.timestamp, 50)) {
      return { valid: false, error: 'Invalid timestamp format' };
    }
    validated.timestamp = sensorData.timestamp;
  }

  return { valid: true, data: validated };
};

// Generate cryptographically secure sensor ID
const generateSecureSensorId = (): string => {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 6).toUpperCase();
};

// Priority mapping and impact generation for different alert types
// Now uses dynamic thresholds passed from user settings
const getPriorityAndType = (alertCategory: string, value: number, threshold: number, criticalThreshold?: number): { priority: 'P1' | 'P2' | 'P3' | 'P4', type: 'error' | 'warning' | 'info' } => {
  const criticalLevel = criticalThreshold || threshold * 1.5;
  
  if (value > criticalLevel) {
    return { priority: 'P1', type: 'error' }; // Critical - immediate attention
  } else if (value > threshold * 1.2) {
    return { priority: 'P2', type: 'warning' }; // High - urgent attention (20% above threshold)
  } else if (value > threshold) {
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
        return `CRITICAL: Dangerous vibration levels (${value.toFixed(2)} m/s²) indicate potential mechanical failure, bearing damage, or structural issues. IMMEDIATE INSPECTION REQUIRED`;
      } else if (priority === 'P2') {
        return `High vibration detected (${value.toFixed(2)} m/s²). Risk of mechanical wear, component loosening, and eventual equipment failure if not addressed`;
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

// Check if request is from internal trigger (has valid anon key or service role)
const isInternalRequest = (req: Request): boolean => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const token = authHeader.replace('Bearer ', '');
  return token === anonKey || token === serviceKey;
};

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify request is from internal trigger or has valid auth
    if (!isInternalRequest(req)) {
      console.warn(`[${requestId}] Unauthorized request attempt`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validation = validateSensorData(rawData);
    if (!validation.valid || !validation.data) {
      console.warn(`[${requestId}] Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: 'Invalid sensor data' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sensorData = validation.data;
    console.log(`[${requestId}] Received validated sensor data`);

    // Get all users' notification settings including vibration threshold
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_id, alert_threshold_temp, alert_threshold_humidity, alert_threshold_vibration, email_enabled');

    if (settingsError) {
      console.error(`[${requestId}] Error fetching notification settings:`, settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to process request' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${requestId}] Processing per-user thresholds for ${settings.length} users`);

    const alerts = [];
    const dbAlerts = [];
    const safeLocation = escapeHtml(sensorData.sensor_location || 'Unknown');

    // Check temperature alerts
    if (sensorData.temperature !== undefined) {
      for (const setting of settings) {
        if (sensorData.temperature > setting.alert_threshold_temp) {
          const { priority, type } = getPriorityAndType('temperature', sensorData.temperature, setting.alert_threshold_temp);
          const shouldEmailP1P2 = (priority === 'P1' || priority === 'P2') && setting.email_enabled;
          
          const alertData = {
            user_id: setting.user_id,
            title: `${priority} Temperature Alert`,
            message: `Temperature reading of ${sensorData.temperature}°C exceeds threshold of ${setting.alert_threshold_temp}°C at ${safeLocation}`,
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
            sensor: `Temp-${generateSecureSensorId()}`,
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
            message: `Humidity reading of ${sensorData.humidity}% exceeds threshold of ${setting.alert_threshold_humidity}% at ${safeLocation}`,
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
            sensor: `Hum-${generateSecureSensorId()}`,
            value: sensorData.humidity.toString(),
            threshold: setting.alert_threshold_humidity.toString(),
            unit: '%',
            impact: generateImpact('humidity', sensorData.humidity, setting.alert_threshold_humidity, priority)
          });
        }
      }
    }

    // Calculate corrected vibration magnitude (gravity-corrected accelerometer)
    let correctedVibration = sensorData.vibration || 0;
    if (sensorData.accel_x !== undefined && sensorData.accel_y !== undefined && sensorData.accel_z !== undefined) {
      // Remove gravity component (Y-axis is vertical, sensor shows -9.6 at rest)
      const correctedY = sensorData.accel_y + 9.81;
      correctedVibration = Math.sqrt(
        Math.pow(sensorData.accel_x, 2) + 
        Math.pow(correctedY, 2) + 
        Math.pow(sensorData.accel_z, 2)
      );
    }

    // Check vibration alerts using per-user configurable thresholds
    for (const setting of settings) {
      const userVibrationThreshold = setting.alert_threshold_vibration ?? 30;
      
      if (correctedVibration > userVibrationThreshold) {
        const { priority, type } = getPriorityAndType('vibration', correctedVibration, userVibrationThreshold);
        const shouldEmailP1P2 = (priority === 'P1' || priority === 'P2') && setting.email_enabled;
        
        console.log(`[${requestId}] Vibration ${correctedVibration.toFixed(2)} exceeds user threshold ${userVibrationThreshold} for user ${setting.user_id}`);
        
        const alertData = {
          user_id: setting.user_id,
          title: `${priority} Vibration Alert`,
          message: `Dangerous vibration level detected: ${correctedVibration.toFixed(4)} m/s² (threshold: ${userVibrationThreshold}) at ${safeLocation}. ${priority === 'P1' ? 'IMMEDIATE INSPECTION REQUIRED!' : 'Urgent inspection required.'}`,
          type: type,
          send_email: shouldEmailP1P2
        };
        
        alerts.push(alertData);
        
        // Create alert in database with user's threshold
        dbAlerts.push({
          title: alertData.title,
          description: alertData.message,
          priority: priority,
          sensor_type: 'vibration',
          sensor_location: sensorData.sensor_location || 'Unknown',
          sensor_value: correctedVibration,
          threshold_value: userVibrationThreshold,
          status: 'active',
          severity: priority === 'P1' ? 'critical' : priority === 'P2' ? 'high' : 'medium',
          category: 'equipment',
          equipment: 'Vibration Sensor',
          location: sensorData.sensor_location || 'Unknown',
          sensor: `Vib-${generateSecureSensorId()}`,
          value: correctedVibration.toFixed(4),
          threshold: userVibrationThreshold.toString(),
          unit: 'm/s²',
          impact: generateImpact('vibration', correctedVibration, userVibrationThreshold, priority)
        });
      }
    }

    // Insert alerts into database
    if (dbAlerts.length > 0) {
      console.log(`[${requestId}] Creating ${dbAlerts.length} alerts in database...`);
      const { error: alertError } = await supabase
        .from('alerts')
        .insert(dbAlerts);
      
      if (alertError) {
        console.error(`[${requestId}] Error creating alerts:`, alertError);
      } else {
        console.log(`[${requestId}] Successfully created alerts in database`);
      }
    }

    // Send alerts through notification service
    if (alerts.length > 0) {
      console.log(`[${requestId}] Sending ${alerts.length} alerts...`);
      
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
            console.error(`[${requestId}] Failed to send notification`);
          }
        } catch (error) {
          console.error(`[${requestId}] Error sending notification:`, error);
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
  } catch (error: unknown) {
    console.error(`[${requestId}] Internal error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', request_id: requestId }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);