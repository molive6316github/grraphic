// Supabase Edge Function for Admin Error Notifications

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ErrorNotification {
  user_id: string;
  error_message: string;
  error_stack?: string;
  context: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { user_id, error_message, error_stack, context }: ErrorNotification = await req.json();

    // Get admin emails from admins table
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

    const adminEmailsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_admin_emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
      }
    );

    if (!adminEmailsResponse.ok) {
      console.error('Failed to fetch admin emails');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch admin emails'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const adminEmails: string[] = await adminEmailsResponse.json();

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No admins to notify'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Format error details
    const errorDetails = `
Error occurred in Grraphic:

Context: ${context}
User ID: ${user_id}
Error Message: ${error_message}
${error_stack ? `\nStack Trace:\n${error_stack}` : ''}

Time: ${new Date().toISOString()}

Please investigate this error at your earliest convenience.
    `.trim();

    // Log notification (in production, you would send actual emails here using a service like SendGrid, Resend, etc.)
    console.log('Error notification prepared for admins:', {
      recipients: adminEmails,
      subject: `[Grraphic Error] ${context}`,
      errorDetails
    });

    // For now, just log. In production, integrate with email service:
    // Example with Resend:
    // const resendApiKey = Deno.env.get('RESEND_API_KEY');
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${resendApiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'errors@grraphic.com',
    //     to: adminEmails,
    //     subject: `[Grraphic Error] ${context}`,
    //     text: errorDetails
    //   })
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin notification prepared',
        admin_count: adminEmails.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in notify-admin-error function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
