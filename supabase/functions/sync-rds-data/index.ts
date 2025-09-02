import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResponse {
  success: boolean;
  synced_count: number;
  rds_info?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabaseClient.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      });
    }

    console.log('Starting RDS data synchronization...');

    // First, check RDS connection status
    const { data: rdsInfo, error: rdsError } = await supabaseClient
      .rpc('get_rds_sensor_data_info');

    if (rdsError) {
      console.error('Failed to get RDS info:', rdsError);
      return new Response(
        JSON.stringify({
          success: false,
          synced_count: 0,
          error: `RDS connection failed: ${rdsError.message}`
        } as SyncResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('RDS Info:', rdsInfo);

    // Sync data from RDS to local tables
    const { data: syncResult, error: syncError } = await supabaseClient
      .rpc('sync_sensor_data_from_rds');

    if (syncError) {
      console.error('Sync failed:', syncError);
      return new Response(
        JSON.stringify({
          success: false,
          synced_count: 0,
          rds_info: rdsInfo?.[0],
          error: `Sync failed: ${syncError.message}`
        } as SyncResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully synced ${syncResult} records from RDS`);

    // If we synced data, trigger some basic ML processing
    if (syncResult > 0) {
      console.log('Triggering anomaly detection for new data...');
      
      // Update anomaly scores for recently synced data
      await supabaseClient
        .from('processed_sensor_readings')
        .update({
          anomaly_score: Math.random() * 0.3, // Simple placeholder - replace with real ML
          predicted_failure_probability: Math.random() * 0.2,
          maintenance_recommendation: 'Normal operation'
        })
        .gte('processed_at', new Date(Date.now() - 5 * 60000).toISOString()); // Last 5 minutes
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_count: syncResult,
        rds_info: rdsInfo?.[0],
      } as SyncResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        synced_count: 0,
        error: error.message
      } as SyncResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});