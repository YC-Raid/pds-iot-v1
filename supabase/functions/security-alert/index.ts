import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate email format
const isValidEmail = (email: unknown): email is string => {
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 254;
};

interface SecurityAlertRequest {
  alert_type: "intrusion" | "door_open_too_long";
  reading_id?: number;
  door_status?: string;
  door_opened_at?: string;
  recipient_email?: string;
}

// Validate security alert request
const validateRequest = (data: unknown): { valid: boolean; data?: SecurityAlertRequest; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = data as Record<string, unknown>;

  // Validate alert_type (required)
  const validAlertTypes = ['intrusion', 'door_open_too_long'];
  if (!req.alert_type || typeof req.alert_type !== 'string' || !validAlertTypes.includes(req.alert_type)) {
    return { valid: false, error: 'Invalid alert type' };
  }

  // Validate reading_id if provided
  if (req.reading_id !== undefined && (typeof req.reading_id !== 'number' || !Number.isInteger(req.reading_id) || req.reading_id < 0)) {
    return { valid: false, error: 'Invalid reading_id' };
  }

  // Validate recipient_email if provided
  if (req.recipient_email !== undefined && !isValidEmail(req.recipient_email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Validate door_opened_at if provided (must be valid ISO date string)
  if (req.door_opened_at !== undefined) {
    if (typeof req.door_opened_at !== 'string') {
      return { valid: false, error: 'Invalid door_opened_at format' };
    }
    const date = new Date(req.door_opened_at);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid door_opened_at date' };
    }
  }

  return {
    valid: true,
    data: {
      alert_type: req.alert_type as SecurityAlertRequest['alert_type'],
      reading_id: req.reading_id as number | undefined,
      door_status: typeof req.door_status === 'string' ? req.door_status.substring(0, 50) : undefined,
      door_opened_at: req.door_opened_at as string | undefined,
      recipient_email: req.recipient_email as string | undefined
    }
  };
};

// Check if request is from internal trigger (has valid anon key or service role)
const isInternalRequest = (req: Request): boolean => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const token = authHeader.replace('Bearer ', '');
  return token === anonKey || token === serviceKey;
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify request is from internal trigger
    if (!isInternalRequest(req)) {
      console.warn(`[${requestId}] Unauthorized request attempt`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(rawData);
    if (!validation.valid || !validation.data) {
      console.warn(`[${requestId}] Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { alert_type, reading_id, door_opened_at, recipient_email } = validation.data;
    console.log(`[${requestId}] Processing security alert: ${alert_type}`);

    // Get admin email from profiles/user_roles instead of using hardcoded email
    let emailTo = recipient_email;
    if (!emailTo) {
      // Fetch admin users to get their email
      const { data: adminRoles } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);
      
      if (adminRoles && adminRoles.length > 0) {
        const { data: adminUser } = await supabaseClient.auth.admin.getUserById(adminRoles[0].user_id);
        emailTo = adminUser?.user?.email;
      }
    }

    if (!emailTo) {
      console.warn(`[${requestId}] No valid recipient email found`);
      return new Response(
        JSON.stringify({ success: false, error: 'No valid recipient email configured' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we've already sent this alert recently (prevent duplicates)
    const { data: existingAlert } = await supabaseClient
      .from("security_alert_log")
      .select("id")
      .eq("alert_type", alert_type)
      .eq("reading_id", reading_id || 0)
      .gte("email_sent_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .single();

    if (existingAlert) {
      console.log(`[${requestId}] Alert already sent recently, skipping duplicate`);
      return new Response(
        JSON.stringify({ success: true, message: "Alert already sent recently" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailSubject = "";
    let emailHtml = "";

    if (alert_type === "intrusion") {
      emailSubject = "🚨 SECURITY ALERT: Door opened during restricted hours";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚨 INTRUSION DETECTED</h1>
          </div>
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; color: white;">
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>Security Alert:</strong> Door opened during restricted hours.
            </p>
            <div style="background: #374151; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> Main Hangar Door</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #ef4444;">INTRUSION ALERT</span></p>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">
              Please investigate immediately and verify authorized access.
            </p>
          </div>
        </div>
      `;
    } else if (alert_type === "door_open_too_long") {
      const openDuration = door_opened_at 
        ? Math.round((Date.now() - new Date(door_opened_at).getTime()) / 60000)
        : 5;
      
      emailSubject = "⚠️ WARNING: Main Door left open";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ DOOR OPEN WARNING</h1>
          </div>
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; color: white;">
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>Warning:</strong> Main Door left open for more than 5 minutes.
            </p>
            <div style="background: #374151; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Duration Open:</strong> ${openDuration} minutes</p>
              <p style="margin: 5px 0;"><strong>Opened At:</strong> ${door_opened_at ? new Date(door_opened_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" }) : "Unknown"}</p>
              <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: #f59e0b;">OPEN</span></p>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">
              Please ensure the door is closed to maintain facility security.
            </p>
          </div>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid alert type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    console.log(`[${requestId}] Sending ${alert_type} email`);
    
    const emailResponse = await resend.emails.send({
      from: "Hangar Guardian <onboarding@resend.dev>",
      to: [emailTo],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log(`[${requestId}] Email sent successfully`);

    // Log the alert to prevent duplicates
    await supabaseClient.from("security_alert_log").insert({
      alert_type,
      reading_id: reading_id || null,
      recipient_email: emailTo,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${alert_type} alert sent successfully`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error(`[${requestId}] Internal error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', request_id: requestId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});