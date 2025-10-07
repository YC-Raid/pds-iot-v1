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

    const now = new Date()
    const singaporeTime = new Intl.DateTimeFormat('en-US', { 
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now)

    console.log(`Starting archiving process at ${singaporeTime} SGT`)

    let deletedRawCount = 0
    let errors = []

    // Strategy 4: Hybrid Approach
    // 0-7 days: Keep all raw readings
    // 8-30 days: Keep raw readings, ensure hourly aggregations exist
    // 31-90 days: Delete raw data, keep hourly aggregations
    // 91+ days: Keep only daily/weekly/monthly aggregations

    // Step 1: Ensure aggregations exist before deleting (8-90 days)
    console.log('Ensuring hourly aggregations exist for 8-90 day old data...')
    const { error: hourlyAggError } = await supabaseClient.rpc('aggregate_sensor_data_hourly')
    if (hourlyAggError) {
      errors.push({ step: 'hourly_aggregation', error: hourlyAggError.message })
      console.error('Error creating hourly aggregations:', hourlyAggError)
    }

    // Step 2: Delete raw readings older than 31 days (keep hourly aggregations)
    const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    console.log(`Deleting raw readings between ${ninetyDaysAgo.toISOString()} and ${thirtyOneDaysAgo.toISOString()}...`)
    
    const { data: deletedRaw, error: deleteRawError } = await supabaseClient
      .from('processed_sensor_readings')
      .delete()
      .lt('recorded_at', thirtyOneDaysAgo.toISOString())
      .gte('recorded_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (deleteRawError) {
      errors.push({ step: 'delete_raw_31_90_days', error: deleteRawError.message })
      console.error('Error deleting raw readings (31-90 days):', deleteRawError)
    } else {
      deletedRawCount += deletedRaw?.length || 0
      console.log(`Deleted ${deletedRaw?.length || 0} raw readings from 31-90 days ago`)
    }

    // Step 3: Ensure daily/weekly/monthly aggregations exist for 91+ days
    console.log('Ensuring daily aggregations exist for 91+ day old data...')
    const { error: dailyAggError } = await supabaseClient.rpc('aggregate_sensor_data_daily')
    if (dailyAggError) {
      errors.push({ step: 'daily_aggregation', error: dailyAggError.message })
      console.error('Error creating daily aggregations:', dailyAggError)
    }

    console.log('Ensuring weekly aggregations exist...')
    const { error: weeklyAggError } = await supabaseClient.rpc('aggregate_sensor_data_weekly')
    if (weeklyAggError) {
      errors.push({ step: 'weekly_aggregation', error: weeklyAggError.message })
      console.error('Error creating weekly aggregations:', weeklyAggError)
    }

    console.log('Ensuring monthly aggregations exist...')
    const { error: monthlyAggError } = await supabaseClient.rpc('aggregate_sensor_data_monthly')
    if (monthlyAggError) {
      errors.push({ step: 'monthly_aggregation', error: monthlyAggError.message })
      console.error('Error creating monthly aggregations:', monthlyAggError)
    }

    // Step 4: Delete raw readings older than 91 days
    console.log(`Deleting raw readings older than ${ninetyDaysAgo.toISOString()}...`)
    
    const { data: deletedOld, error: deleteOldError } = await supabaseClient
      .from('processed_sensor_readings')
      .delete()
      .lt('recorded_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (deleteOldError) {
      errors.push({ step: 'delete_raw_91_plus_days', error: deleteOldError.message })
      console.error('Error deleting old raw readings (91+ days):', deleteOldError)
    } else {
      deletedRawCount += deletedOld?.length || 0
      console.log(`Deleted ${deletedOld?.length || 0} raw readings older than 91 days`)
    }

    // Step 5: Delete hourly aggregations older than 91 days
    console.log(`Deleting hourly aggregations older than ${ninetyDaysAgo.toISOString()}...`)
    
    const { data: deletedHourly, error: deleteHourlyError } = await supabaseClient
      .from('sensor_readings_aggregated')
      .delete()
      .eq('aggregation_level', 'hour')
      .lt('time_bucket', ninetyDaysAgo.toISOString())
      .select('id')

    if (deleteHourlyError) {
      errors.push({ step: 'delete_hourly_agg', error: deleteHourlyError.message })
      console.error('Error deleting old hourly aggregations:', deleteHourlyError)
    } else {
      console.log(`Deleted ${deletedHourly?.length || 0} hourly aggregations older than 91 days`)
    }

    const completedTime = new Intl.DateTimeFormat('en-US', { 
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date())

    console.log(`Archiving completed at ${completedTime} SGT`)

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        message: 'Data archiving completed',
        summary: {
          deleted_raw_readings: deletedRawCount,
          deleted_hourly_aggregations: deletedHourly?.length || 0,
          completed_at_sgt: completedTime,
          errors: errors.length > 0 ? errors : undefined
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errors.length > 0 ? 207 : 200,
      },
    )
  } catch (error: any) {
    console.error('Error in archiving function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
