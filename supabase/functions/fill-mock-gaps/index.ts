import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SensorReading {
  recorded_at: string;
  temperature: number;
  humidity: number;
  pressure: number;
  gas_resistance: number;
  pm1_0: number;
  pm2_5: number;
  pm10: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get existing data from mock_sensor_dataset for Sep 1-18, 2025
    const { data: existingData, error: fetchError } = await supabaseClient
      .from('mock_sensor_dataset')
      .select('*')
      .gte('recorded_at', '2025-09-01T00:00:00Z')
      .lte('recorded_at', '2025-09-18T23:59:59Z')
      .order('recorded_at', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${existingData?.length || 0} existing records`)

    // Find gaps and generate mock data with 10-second intervals
    const mockData: any[] = []
    const startDate = new Date('2025-09-01T00:00:00Z')
    const endDate = new Date('2025-09-18T23:59:59Z')
    
    // Create a set of existing timestamps for quick lookup
    const existingTimestamps = new Set(existingData?.map(d => d.recorded_at) || [])
    
    // Generate data points every 10 seconds
    const current = new Date(startDate)
    let originalId = Math.max(...(existingData?.map(d => d.original_id) || [0])) + 1

    while (current <= endDate) {
      const timestamp = current.toISOString()
      
      // If this timestamp doesn't exist in our data, generate mock data
      if (!existingTimestamps.has(timestamp)) {
        // Use baseline values with some variation for realistic mock data
        const mockReading = {
          original_id: originalId++,
          recorded_at: timestamp,
          location: 'hangar_01',
          temperature: 25.0 + (Math.random() - 0.5) * 10, // ±5°C variation
          humidity: 60.0 + (Math.random() - 0.5) * 20, // ±10% variation
          pressure: 1013.25 + (Math.random() - 0.5) * 20, // ±10 hPa variation
          gas_resistance: 200000 + (Math.random() - 0.5) * 100000, // ±50k variation
          pm1_0: Math.max(0, Math.round(10 + (Math.random() - 0.5) * 20)),
          pm2_5: Math.max(0, Math.round(15 + (Math.random() - 0.5) * 30)),
          pm10: Math.max(0, Math.round(25 + (Math.random() - 0.5) * 50)),
          accel_x: (Math.random() - 0.5) * 2, // ±1 g
          accel_y: (Math.random() - 0.5) * 2,
          accel_z: 9.8 + (Math.random() - 0.5) * 0.4, // gravity ±0.2
          gyro_x: (Math.random() - 0.5) * 10, // ±5 deg/s
          gyro_y: (Math.random() - 0.5) * 10,
          gyro_z: (Math.random() - 0.5) * 10,
          anomaly_score: Math.random() * 0.3, // Low anomaly scores
          predicted_failure_probability: Math.random() * 0.1, // Low failure probability
          quality_score: Math.round(90 + Math.random() * 10), // 90-100 quality
          maintenance_recommendation: Math.random() > 0.95 ? 'routine_check' : null,
          processing_version: 'v1.0',
          is_mock_data: true
        }
        
        mockData.push(mockReading)
      }
      
      // Advance by 10 seconds
      current.setSeconds(current.getSeconds() + 10)
    }

    console.log(`Generated ${mockData.length} mock data points`)

    // Insert mock data in batches to avoid timeouts
    const batchSize = 1000
    let insertedCount = 0
    
    for (let i = 0; i < mockData.length; i += batchSize) {
      const batch = mockData.slice(i, i + batchSize)
      
      const { error: insertError } = await supabaseClient
        .from('mock_sensor_dataset')
        .insert(batch)

      if (insertError) {
        console.error('Batch insert error:', insertError)
        throw insertError
      }
      
      insertedCount += batch.length
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}, total: ${insertedCount}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully filled gaps with ${insertedCount} mock data points`,
        existingRecords: existingData?.length || 0,
        mockRecords: insertedCount,
        totalRecords: (existingData?.length || 0) + insertedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error filling gaps:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})