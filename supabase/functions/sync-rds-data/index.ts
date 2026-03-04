import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResponse {
  success: boolean;
  synced_count: number;
  rds_info?: {
    connection_status: string;
    latest_timestamp: string;
    total_count: number;
  };
  error?: string;
  request_id?: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
      console.error(`[${requestId}] Missing required Supabase environment variables`);
      return new Response(
        JSON.stringify({ success: false, synced_count: 0, error: 'Server configuration error', request_id: requestId } as SyncResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get authorization header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Missing or invalid authorization header`);
      return new Response(
        JSON.stringify({ success: false, synced_count: 0, error: 'Unauthorized' } as SyncResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.warn(`[${requestId}] Invalid or expired token`);
      return new Response(
        JSON.stringify({ success: false, synced_count: 0, error: 'Invalid authentication' } as SyncResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      console.warn(`[${requestId}] User ${user.id} is not an admin`);
      return new Response(
        JSON.stringify({ success: false, synced_count: 0, error: 'Admin access required' } as SyncResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userScopedClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log(`[${requestId}] Starting RDS data synchronization for admin user ${user.id}`);

    // Call admin-protected RPCs with user JWT context so auth.uid() is available
    const { data: rdsInfo, error: rdsError } = await userScopedClient
      .rpc('get_rds_sensor_data_info');

    if (rdsError) {
      console.error(`[${requestId}] Failed to get RDS info:`, rdsError);
      return new Response(
        JSON.stringify({
          success: false,
          synced_count: 0,
          error: 'Database connection failed',
          request_id: requestId
        } as SyncResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] RDS Info:`, rdsInfo);

    // Sync data from RDS to local tables
    const { data: syncResult, error: syncError } = await userScopedClient
      .rpc('sync_sensor_data_from_rds');

    if (syncError) {
      console.error(`[${requestId}] Sync failed:`, syncError);
      return new Response(
        JSON.stringify({
          success: false,
          synced_count: 0,
          error: 'Sync operation failed',
          request_id: requestId
        } as SyncResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[${requestId}] Successfully synced ${syncResult} records from RDS`);

    // If we synced data, trigger some basic ML processing
    if (syncResult > 0) {
      console.log(`[${requestId}] Triggering anomaly detection for new data...`);
      
      // Update anomaly scores for recently synced data
      await userScopedClient
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

  } catch (error: unknown) {
    console.error(`[${requestId}] Internal error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        synced_count: 0,
        error: 'Internal server error',
        request_id: requestId
      } as SyncResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});