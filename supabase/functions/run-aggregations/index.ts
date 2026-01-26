import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Running sensor data aggregations...')

    // Run all aggregation functions
    const { data, error } = await supabaseClient.rpc('run_all_sensor_aggregations')

    if (error) {
      console.error('Error running aggregations:', error)
      throw error
    }

    console.log('Aggregation results:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: data,
        message: 'Aggregations completed successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: unknown) {
    const requestId = crypto.randomUUID();
    console.error(`[${requestId}] Aggregation error:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Aggregation operation failed',
        request_id: requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})