import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const now = new Date()
    const sgtTime = new Intl.DateTimeFormat('en-SG', { 
      timeZone: 'Asia/Singapore', dateStyle: 'medium', timeStyle: 'long'
    }).format(now)

    console.log(`Starting cascading cleanup at ${sgtTime}`)

    // Call the updated cleanup function which:
    // 1. Aggregates all tiers (raw→1min→hour→day→week→month)
    // 2. Deletes each tier after confirming next tier exists
    const { data, error } = await supabaseClient.rpc('cleanup_old_sensor_data')

    if (error) {
      console.error('Cleanup error:', error)
      throw error
    }

    const result = data?.[0] || { deleted_readings: 0, deleted_alerts: 0, deleted_notifications: 0 }
    console.log('Cleanup results:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cascading cleanup completed',
        summary: {
          deleted_raw_readings: result.deleted_readings,
          deleted_alerts: result.deleted_alerts,
          deleted_notifications: result.deleted_notifications,
          completed_at_sgt: sgtTime,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error: any) {
    console.error('Archive function error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
