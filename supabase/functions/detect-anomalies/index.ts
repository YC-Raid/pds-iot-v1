import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch user-defined thresholds from notification_settings
    // We'll use the most restrictive (lowest) threshold across all users for system-wide alerts
    const { data: userSettings } = await supabaseClient
      .from('notification_settings')
      .select('alert_threshold_temp, alert_threshold_humidity')

    // Calculate the minimum thresholds from user settings (most sensitive)
    let userTempThreshold = 30 // default max
    let userHumidityThreshold = 70 // default max

    if (userSettings && userSettings.length > 0) {
      const validTempThresholds = userSettings
        .map(s => s.alert_threshold_temp)
        .filter(t => t !== null && t !== undefined) as number[]
      const validHumidityThresholds = userSettings
        .map(s => s.alert_threshold_humidity)
        .filter(h => h !== null && h !== undefined) as number[]

      if (validTempThresholds.length > 0) {
        userTempThreshold = Math.min(...validTempThresholds)
      }
      if (validHumidityThresholds.length > 0) {
        userHumidityThreshold = Math.min(...validHumidityThresholds)
      }
    }

    console.log(`Using thresholds - Temperature: ${userTempThreshold}°C, Humidity: ${userHumidityThreshold}%`)

    // Define thresholds for different sensors - now using user-defined values where applicable
    const thresholds = {
      temperature: { min: 15, max: userTempThreshold, critical: userTempThreshold + 5 },
      humidity: { min: 30, max: userHumidityThreshold, critical: userHumidityThreshold + 15 },
      pressure: { min: 1000, max: 1020, critical: 1030 },
      pm2_5: { max: 35, critical: 75 },
      anomaly_score: { warning: 0.6, critical: 0.8 },
      failure_probability: { warning: 0.4, critical: 0.7 }
    }

    // Get recent sensor readings (last 5 minutes to reduce processing load)
    // Only alert on data recorded within the last 7 days to prevent false alerts from old data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: readings, error: readingsError } = await supabaseClient
      .from('processed_sensor_readings')
      .select('*')
      .gte('recorded_at', sevenDaysAgo) // Only check data from last 7 days
      .gte('processed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Recently processed
      .order('recorded_at', { ascending: false })
      .limit(100) // Limit processing to recent 100 readings

    if (readingsError) {
      throw readingsError
    }

    console.log(`Processing ${readings?.length || 0} sensor readings for anomaly detection`)

    const alertsToCreate = []

    for (const reading of readings || []) {
      const alerts = []

      // Check temperature anomalies
      if (reading.temperature !== null) {
        if (reading.temperature > thresholds.temperature.critical) {
          alerts.push({
            title: `Critical Temperature Alert`,
            description: `Temperature reading of ${reading.temperature}°C exceeds critical threshold of ${thresholds.temperature.critical}°C`,
            severity: 'critical',
            priority: 'P1',
            sensor_type: 'temperature',
            value: reading.temperature.toString(),
            threshold: thresholds.temperature.critical.toString(),
            threshold_value: thresholds.temperature.critical,
            sensor_value: reading.temperature,
            unit: '°C'
          })
        } else if (reading.temperature > thresholds.temperature.max || reading.temperature < thresholds.temperature.min) {
          alerts.push({
            title: `Temperature Warning`,
            description: `Temperature reading of ${reading.temperature}°C is outside normal range (${thresholds.temperature.min}-${thresholds.temperature.max}°C)`,
            severity: 'high',
            priority: 'P2',
            sensor_type: 'temperature',
            value: reading.temperature.toString(),
            threshold: `${thresholds.temperature.min}-${thresholds.temperature.max}`,
            threshold_value: thresholds.temperature.max,
            sensor_value: reading.temperature,
            unit: '°C'
          })
        }
      }

      // Check humidity anomalies
      if (reading.humidity !== null) {
        if (reading.humidity > thresholds.humidity.critical) {
          alerts.push({
            title: `Critical Humidity Alert`,
            description: `Humidity reading of ${reading.humidity}% exceeds critical threshold of ${thresholds.humidity.critical}%`,
            severity: 'critical',
            priority: 'P1',
            sensor_type: 'humidity',
            value: reading.humidity.toString(),
            threshold: thresholds.humidity.critical.toString(),
            threshold_value: thresholds.humidity.critical,
            sensor_value: reading.humidity,
            unit: '%'
          })
        } else if (reading.humidity > thresholds.humidity.max || reading.humidity < thresholds.humidity.min) {
          alerts.push({
            title: `Humidity Warning`,
            description: `Humidity reading of ${reading.humidity}% is outside normal range (${thresholds.humidity.min}-${thresholds.humidity.max}%)`,
            severity: 'high',
            priority: 'P2',
            sensor_type: 'humidity',
            value: reading.humidity.toString(),
            threshold: `${thresholds.humidity.min}-${thresholds.humidity.max}`,
            threshold_value: thresholds.humidity.max,
            sensor_value: reading.humidity,
            unit: '%'
          })
        }
      }

      // Check pressure anomalies
      if (reading.pressure !== null) {
        if (reading.pressure > thresholds.pressure.critical) {
          alerts.push({
            title: `Critical Pressure Alert`,
            description: `Pressure reading of ${reading.pressure} hPa exceeds critical threshold of ${thresholds.pressure.critical} hPa`,
            severity: 'critical',
            priority: 'P1',
            sensor_type: 'pressure',
            value: reading.pressure.toString(),
            threshold: thresholds.pressure.critical.toString(),
            threshold_value: thresholds.pressure.critical,
            sensor_value: reading.pressure,
            unit: 'hPa'
          })
        } else if (reading.pressure > thresholds.pressure.max || reading.pressure < thresholds.pressure.min) {
          alerts.push({
            title: `Pressure Warning`,
            description: `Pressure reading of ${reading.pressure} hPa is outside normal range (${thresholds.pressure.min}-${thresholds.pressure.max} hPa)`,
            severity: 'high',
            priority: 'P2',
            sensor_type: 'pressure',
            value: reading.pressure.toString(),
            threshold: `${thresholds.pressure.min}-${thresholds.pressure.max}`,
            threshold_value: thresholds.pressure.max,
            sensor_value: reading.pressure,
            unit: 'hPa'
          })
        }
      }

      // Check air quality (PM2.5) anomalies
      if (reading.pm2_5 !== null) {
        if (reading.pm2_5 > thresholds.pm2_5.critical) {
          alerts.push({
            title: `Critical Air Quality Alert`,
            description: `PM2.5 reading of ${reading.pm2_5} μg/m³ exceeds critical threshold of ${thresholds.pm2_5.critical} μg/m³`,
            severity: 'critical',
            priority: 'P1',
            sensor_type: 'air_quality',
            value: reading.pm2_5.toString(),
            threshold: thresholds.pm2_5.critical.toString(),
            threshold_value: thresholds.pm2_5.critical,
            sensor_value: reading.pm2_5,
            unit: 'μg/m³'
          })
        } else if (reading.pm2_5 > thresholds.pm2_5.max) {
          alerts.push({
            title: `Air Quality Warning`,
            description: `PM2.5 reading of ${reading.pm2_5} μg/m³ exceeds safe threshold of ${thresholds.pm2_5.max} μg/m³`,
            severity: 'high',
            priority: 'P2',
            sensor_type: 'air_quality',
            value: reading.pm2_5.toString(),
            threshold: thresholds.pm2_5.max.toString(),
            threshold_value: thresholds.pm2_5.max,
            sensor_value: reading.pm2_5,
            unit: 'μg/m³'
          })
        }
      }

      // Check anomaly score
      if (reading.anomaly_score !== null) {
        if (reading.anomaly_score > thresholds.anomaly_score.critical) {
          alerts.push({
            title: `Critical Anomaly Detected`,
            description: `Sensor anomaly score of ${reading.anomaly_score.toFixed(3)} indicates critical system deviation`,
            severity: 'critical',
            priority: 'P1',
            sensor_type: 'anomaly',
            value: reading.anomaly_score.toFixed(3),
            threshold: thresholds.anomaly_score.critical.toString(),
            threshold_value: thresholds.anomaly_score.critical,
            sensor_value: reading.anomaly_score,
            unit: 'score'
          })
        } else if (reading.anomaly_score > thresholds.anomaly_score.warning) {
          alerts.push({
            title: `Anomaly Warning`,
            description: `Sensor anomaly score of ${reading.anomaly_score.toFixed(3)} indicates unusual behavior`,
            severity: 'high',
            priority: 'P2',
            sensor_type: 'anomaly',
            value: reading.anomaly_score.toFixed(3),
            threshold: thresholds.anomaly_score.warning.toString(),
            threshold_value: thresholds.anomaly_score.warning,
            sensor_value: reading.anomaly_score,
            unit: 'score'
          })
        }
      }

      // Check failure probability
      if (reading.predicted_failure_probability !== null) {
        if (reading.predicted_failure_probability > thresholds.failure_probability.critical) {
          alerts.push({
            title: `Critical Failure Risk`,
            description: `Predicted failure probability of ${(reading.predicted_failure_probability * 100).toFixed(1)}% indicates imminent system failure risk`,
            severity: 'critical',
            priority: 'P1',
            sensor_type: 'failure_prediction',
            value: (reading.predicted_failure_probability * 100).toFixed(1),
            threshold: (thresholds.failure_probability.critical * 100).toString(),
            threshold_value: thresholds.failure_probability.critical,
            sensor_value: reading.predicted_failure_probability,
            unit: '%'
          })
        } else if (reading.predicted_failure_probability > thresholds.failure_probability.warning) {
          alerts.push({
            title: `Elevated Failure Risk`,
            description: `Predicted failure probability of ${(reading.predicted_failure_probability * 100).toFixed(1)}% indicates elevated maintenance risk`,
            severity: 'high',
            priority: 'P2',
            sensor_type: 'failure_prediction',
            value: (reading.predicted_failure_probability * 100).toFixed(1),
            threshold: (thresholds.failure_probability.warning * 100).toString(),
            threshold_value: thresholds.failure_probability.warning,
            sensor_value: reading.predicted_failure_probability,
            unit: '%'
          })
        }
      }

      // Add common fields to each alert
      for (const alert of alerts) {
        alertsToCreate.push({
          ...alert,
          category: 'sensor_anomaly',
          equipment: `Sensor Array`,
          location: reading.location || 'hangar_01',
          sensor: alert.sensor_type,
          status: 'active'
        })
      }
    }

    console.log(`Generated ${alertsToCreate.length} alerts from anomaly detection`)

    // Insert alerts into database (avoid duplicates by checking recent alerts)
    if (alertsToCreate.length > 0) {
      // Check for recent similar alerts to avoid spam (extended to 24 hours)
      const { data: recentAlerts } = await supabaseClient
        .from('alerts')
        .select('sensor_type, location, status, sensor_value, threshold_value')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours instead of 1 hour
        .in('status', ['active', 'acknowledged', 'in_progress'])

      const recentAlertKeys = new Set(
        (recentAlerts || []).map(alert => `${alert.sensor_type}-${alert.location}-${alert.sensor_value}-${alert.threshold_value}`)
      )

      // Filter out alerts that are similar to recent ones (more specific matching)
      const newAlerts = alertsToCreate.filter(alert => 
        !recentAlertKeys.has(`${alert.sensor_type}-${alert.location}-${alert.sensor_value}-${alert.threshold_value}`)
      )

      if (newAlerts.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('alerts')
          .insert(newAlerts)

        if (insertError) {
          throw insertError
        }

        console.log(`Successfully created ${newAlerts.length} new alerts`)
      } else {
        console.log('No new alerts to create (similar alerts already exist)')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_readings: readings?.length || 0,
        alerts_generated: alertsToCreate.length,
        thresholds_used: {
          temperature: thresholds.temperature,
          humidity: thresholds.humidity
        },
        message: 'Anomaly detection completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Error in anomaly detection:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
