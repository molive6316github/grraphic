import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith("http")) {
      return new Response(
        JSON.stringify({ error: "Invalid URL protocol" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use pikwy.com - completely free screenshot API, no key needed
    // This service is reliable and doesn't require authentication
    const screenshotUrl = `https://api.pikwy.com/web/screenshot?u=${encodeURIComponent(url)}&w=1920&h=1080&d=2&t=5000&f=png`;
    
    console.log('Attempting screenshot with pikwy:', screenshotUrl);
    
    let response = await fetch(screenshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // If pikwy fails, try screenshot.guru (also free)
    if (!response.ok) {
      console.log('pikwy failed, trying screenshot.guru');
      const guruUrl = `https://www.screenshotmachine.com/capture.php?key=ab8ece&url=${encodeURIComponent(url)}&dimension=1920x1080&format=png&cacheLimit=0&delay=3000`;
      response = await fetch(guruUrl);
    }
    
    // If both fail, try a simple webpage thumbnail service
    if (!response.ok) {
      console.log('screenshot.guru failed, trying webpage thumbnail');
      const thumbUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(url)}`;
      response = await fetch(thumbUrl);
    }

    if (!response.ok) {
      // Last resort: return a helpful error
      return new Response(
        JSON.stringify({ 
          error: "Screenshot services temporarily unavailable. Please try uploading a screenshot manually.",
          suggestion: "You can take a screenshot of the website yourself and upload it directly."
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    return new Response(
      JSON.stringify({ screenshot: base64Image }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to capture screenshot. Try uploading a screenshot manually.",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
