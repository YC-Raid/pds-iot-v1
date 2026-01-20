import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in emails
const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Input validation helpers
const isValidString = (val: unknown, maxLength: number): val is string => {
  return typeof val === 'string' && val.length <= maxLength;
};

const isValidUuid = (val: unknown): val is string => {
  if (typeof val !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
};

interface NotificationRequest {
  user_id?: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  send_email?: boolean;
  // email_template is intentionally not supported for security reasons
}

// Validate notification request
const validateRequest = (data: unknown): { valid: boolean; data?: NotificationRequest; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = data as Record<string, unknown>;

  // Validate title (required, max 200 chars)
  if (!isValidString(req.title, 200)) {
    return { valid: false, error: 'Title is required and must be less than 200 characters' };
  }

  // Validate message (required, max 2000 chars)
  if (!isValidString(req.message, 2000)) {
    return { valid: false, error: 'Message is required and must be less than 2000 characters' };
  }

  // Validate user_id if provided (must be valid UUID)
  if (req.user_id !== undefined && !isValidUuid(req.user_id)) {
    return { valid: false, error: 'Invalid user_id format' };
  }

  // Validate type if provided
  const validTypes = ['info', 'warning', 'error', 'success'];
  if (req.type !== undefined && (typeof req.type !== 'string' || !validTypes.includes(req.type))) {
    return { valid: false, error: 'Invalid notification type' };
  }

  return {
    valid: true,
    data: {
      user_id: req.user_id as string | undefined,
      title: req.title as string,
      message: req.message as string,
      type: (req.type as NotificationRequest['type']) || 'info',
      send_email: req.send_email === true
    }
  };
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = Deno.env.get('RESEND_API_KEY') ? new Resend(Deno.env.get('RESEND_API_KEY')) : null;

// Check if request is from internal trigger (has valid anon key or service role)
const isInternalRequest = (req: Request): boolean => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const token = authHeader.replace('Bearer ', '');
  return token === anonKey || token === serviceKey;
};

const handler = async (req: Request): Promise<Response> => {
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
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validation = validateRequest(rawData);
    if (!validation.valid || !validation.data) {
      console.warn(`[${requestId}] Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { user_id, title, message, type, send_email } = validation.data;
    console.log(`[${requestId}] Processing notification request`);

    // Get user info if user_id is provided
    let targetUsers = [];
    if (user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .eq('user_id', user_id)
        .single();

      if (profileError) {
        console.error(`[${requestId}] Error fetching user profile:`, profileError);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
      if (userError) {
        console.error(`[${requestId}] Error fetching user data:`, userError);
        return new Response(
          JSON.stringify({ error: 'User data not found' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      targetUsers = [{
        user_id: profile.user_id,
        nickname: profile.nickname,
        email: userData.user.email
      }];
    } else {
      // Send to all users if no specific user_id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nickname');

      if (profilesError) {
        console.error(`[${requestId}] Error fetching profiles:`, profilesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users' }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get email addresses for all users
      for (const profile of profiles) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);
        if (!userError && userData.user.email) {
          targetUsers.push({
            user_id: profile.user_id,
            nickname: profile.nickname,
            email: userData.user.email
          });
        }
      }
    }

    console.log(`[${requestId}] Target users: ${targetUsers.length}`);

    // Create in-app notifications with sanitized content
    const notifications = targetUsers.map(user => ({
      user_id: user.user_id,
      title: title.substring(0, 200), // Enforce length limit
      message: message.substring(0, 2000), // Enforce length limit
      type
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error(`[${requestId}] Error creating notifications:`, notificationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email notifications if requested
    if (send_email && resend) {
      console.log(`[${requestId}] Sending email notifications...`);
      
      // Escape HTML in title and message for email
      const safeTitle = escapeHtml(title);
      const safeMessage = escapeHtml(message);
      
      for (const user of targetUsers) {
        try {
          // Check user's email notification preferences
          const { data: settings } = await supabase
            .from('notification_settings')
            .select('email_enabled')
            .eq('user_id', user.user_id)
            .single();

          if (user.email && settings?.email_enabled !== false) {
            // Use safe HTML template with escaped content - no custom templates allowed
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1e3a5f, #0f172a); padding: 20px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">Hangar Guardian Alert</h1>
                </div>
                <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; color: white;">
                  <h2 style="color: #60a5fa; margin-top: 0;">${safeTitle}</h2>
                  <p style="line-height: 1.6;">${safeMessage}</p>
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                    This is an automated alert from Hangar Guardian monitoring system.
                  </p>
                </div>
              </div>
            `;

            await resend.emails.send({
              from: 'Hangar Guardian <alerts@hangarguardian.com>',
              to: [user.email],
              subject: `Alert: ${safeTitle}`,
              html: emailHtml,
            });

            console.log(`[${requestId}] Email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`[${requestId}] Failed to send email to ${user.email}:`, emailError);
          // Continue with other users even if one email fails
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: targetUsers.length,
        message: 'Notifications sent successfully'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    console.error(`[${requestId}] Internal error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', request_id: requestId }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);