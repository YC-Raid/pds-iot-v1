import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id?: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  send_email?: boolean;
  email_template?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      title,
      message,
      type = 'info',
      send_email = false,
      email_template
    }: NotificationRequest = await req.json();

    console.log('Notification request:', { user_id, title, message, type, send_email });

    // Get user info if user_id is provided
    let targetUsers = [];
    if (user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .eq('user_id', user_id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('User not found');
      }

      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error('User data not found');
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
        console.error('Error fetching profiles:', profilesError);
        throw new Error('Error fetching users');
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

    console.log('Target users:', targetUsers.length);

    // Create in-app notifications
    const notifications = targetUsers.map(user => ({
      user_id: user.user_id,
      title,
      message,
      type
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      throw new Error('Failed to create notifications');
    }

    // Send email notifications if requested
    if (send_email && Deno.env.get('RESEND_API_KEY')) {
      console.log('Sending email notifications...');
      
      for (const user of targetUsers) {
        try {
          // Check user's email notification preferences
          const { data: settings } = await supabase
            .from('notification_settings')
            .select('email_enabled')
            .eq('user_id', user.user_id)
            .single();

          if (settings?.email_enabled !== false) { // Default to true if no settings
            const emailHtml = email_template || `
              <h1>New Alert from Hangar Guardian</h1>
              <h2>${title}</h2>
              <p>${message}</p>
              <p>Best regards,<br>Hangar Guardian System</p>
            `;

            await resend.emails.send({
              from: 'Hangar Guardian <alerts@hangarguardian.com>',
              to: [user.email],
              subject: `Alert: ${title}`,
              html: emailHtml,
            });

            console.log(`Email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
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
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);