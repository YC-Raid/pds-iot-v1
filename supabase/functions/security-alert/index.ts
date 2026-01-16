import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  alert_type: "intrusion" | "door_open_too_long";
  reading_id?: number;
  door_status?: string;
  door_opened_at?: string;
  recipient_email?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const requestData: SecurityAlertRequest = await req.json();
    console.log("Security alert request:", requestData);

    const { alert_type, reading_id, door_status, door_opened_at, recipient_email } = requestData;

    // Default recipient email (can be configured per user in production)
    const emailTo = recipient_email || "admin@example.com";

    // Check if we've already sent this alert recently (prevent duplicates)
    const { data: existingAlert } = await supabaseClient
      .from("security_alert_log")
      .select("id")
      .eq("alert_type", alert_type)
      .eq("reading_id", reading_id || 0)
      .gte("email_sent_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .single();

    if (existingAlert) {
      console.log("Alert already sent recently, skipping duplicate");
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
    console.log(`Sending ${alert_type} email to ${emailTo}`);
    
    const emailResponse = await resend.emails.send({
      from: "Hangar Guardian <onboarding@resend.dev>",
      to: [emailTo],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the alert to prevent duplicates
    await supabaseClient.from("security_alert_log").insert({
      alert_type,
      reading_id: reading_id || null,
      recipient_email: emailTo,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${alert_type} alert sent successfully`,
        email_response: emailResponse 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Security alert error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
