import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MockSensorReading {
  original_id: number
  recorded_at: string
  temperature: number
  humidity: number
  pressure: number
  gas_resistance: number
  pm1_0: number
  pm2_5: number
  pm10: number
  accel_x: number
  accel_y: number
  accel_z: number
  accel_magnitude: number
  gyro_x: number
  gyro_y: number
  gyro_z: number
  gyro_magnitude: number
  anomaly_score: number
  predicted_failure_probability: number
  quality_score: number
  is_mock_data: boolean
  location: string
  maintenance_recommendation: string
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateSensorReading(id: number, timestamp: Date): MockSensorReading {
  // Generate accelerometer data (realistic hangar vibration: -2g to +2g)
  const accel_x = randomInRange(-19.62, 19.62) // m/s²
  const accel_y = randomInRange(-19.62, 19.62)
  const accel_z = randomInRange(-19.62, 19.62)
  const accel_magnitude = Math.sqrt(accel_x * accel_x + accel_y * accel_y + accel_z * accel_z)
  
  // Generate gyroscope data (realistic rotation: -250 to +250 deg/s)
  const gyro_x = randomInRange(-250, 250)
  const gyro_y = randomInRange(-250, 250) 
  const gyro_z = randomInRange(-250, 250)
  const gyro_magnitude = Math.sqrt(gyro_x * gyro_x + gyro_y * gyro_y + gyro_z * gyro_z)
  
  // Generate environmental data with your specified ranges
  const temperature = randomInRange(35, 40)
  const humidity = randomInRange(35, 60)
  const pressure = randomInRange(1005, 1015)
  const gas_resistance = randomInRange(82000, 120000)
  
  // Generate particulate matter (realistic air quality ranges)
  const pm1_0 = Math.floor(randomInRange(0, 50))
  const pm2_5 = Math.floor(randomInRange(0, 100))
  const pm10 = Math.floor(randomInRange(0, 150))
  
  // Calculate anomaly score based on thresholds
  let anomaly_score = 0
  if (temperature > 38) anomaly_score += 0.3
  if (humidity > 55) anomaly_score += 0.2
  if (accel_magnitude > 15) anomaly_score += 0.4
  if (pm2_5 > 80) anomaly_score += 0.3
  
  // Add some random noise to anomaly score
  anomaly_score += randomInRange(-0.1, 0.1)
  anomaly_score = Math.max(0, Math.min(1, anomaly_score))
  
  // Calculate failure probability based on anomaly score
  const predicted_failure_probability = Math.min(1, anomaly_score * 0.8 + randomInRange(0, 0.2))
  
  // Quality score based on sensor stability
  const quality_score = Math.floor(randomInRange(85, 100))
  
  // Maintenance recommendation based on readings
  let maintenance_recommendation = 'normal_operation'
  if (anomaly_score > 0.7) maintenance_recommendation = 'immediate_inspection'
  else if (anomaly_score > 0.5) maintenance_recommendation = 'schedule_maintenance'
  else if (anomaly_score > 0.3) maintenance_recommendation = 'monitor_closely'
  
  return {
    original_id: id,
    recorded_at: timestamp.toISOString(),
    temperature,
    humidity,
    pressure,
    gas_resistance,
    pm1_0,
    pm2_5,
    pm10,
    accel_x,
    accel_y,
    accel_z,
    accel_magnitude,
    gyro_x,
    gyro_y,
    gyro_z,
    gyro_magnitude,
    anomaly_score,
    predicted_failure_probability,
    quality_score: quality_score,
    is_mock_data: true,
    location: 'hangar_01',
    maintenance_recommendation
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting mock data population...')
    
    // Clear existing mock data
    const { error: deleteError } = await supabaseClient
      .from('mock_sensor_dataset')
      .delete()
      .eq('is_mock_data', true)
    
    if (deleteError) {
      console.error('Error clearing existing mock data:', deleteError)
    } else {
      console.log('✅ Cleared existing mock data')
    }

    // Generate data from Sept 1-15, 2025, every 10 seconds
    const startDate = new Date('2025-09-01T00:00:00.000Z')
    const endDate = new Date('2025-09-15T23:59:50.000Z')
    const intervalMs = 10 * 1000 // 10 seconds
    
    const mockData: MockSensorReading[] = []
    let id = 1
    
    console.log(`📊 Generating data from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    for (let timestamp = new Date(startDate); timestamp <= endDate; timestamp.setTime(timestamp.getTime() + intervalMs)) {
      mockData.push(generateSensorReading(id++, new Date(timestamp)))
      
      // Insert in batches of 1000 to prevent memory issues
      if (mockData.length >= 1000) {
        const { error: insertError } = await supabaseClient
          .from('mock_sensor_dataset')
          .insert(mockData)
        
        if (insertError) {
          console.error('Batch insert error:', insertError)
          throw insertError
        }
        
        console.log(`📝 Inserted batch of ${mockData.length} records. Total processed: ${id - 1}`)
        mockData.length = 0 // Clear array
      }
    }
    
    // Insert remaining data
    if (mockData.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('mock_sensor_dataset')
        .insert(mockData)
      
      if (insertError) {
        console.error('Final batch insert error:', insertError)
        throw insertError
      }
      
      console.log(`📝 Inserted final batch of ${mockData.length} records`)
    }

    const totalRecords = id - 1
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log(`✅ Successfully populated ${totalRecords} mock sensor readings for ${totalDays} days`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully populated ${totalRecords} mock sensor readings`,
        details: {
          total_records: totalRecords,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          interval_seconds: 10,
          total_days: totalDays
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error populating mock data:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to populate mock sensor dataset'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})