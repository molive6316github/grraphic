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

    // Try multiple screenshot services in order of preference
    let base64Image: string | null = null;
    let lastError: string = "";

    // Option 1: Use thum.io (free, no API key needed)
    try {
      const thumbioUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(url)}`;
      const response = await fetch(thumbioUrl);
      
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        base64Image = btoa(
          new Uint8Array(imageBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
      } else {
        lastError = `thum.io failed: ${response.status}`;
      }
    } catch (e) {
      lastError = `thum.io error: ${e instanceof Error ? e.message : 'Unknown'}`;
    }

    // Option 2: Use screenshot.screenshotone.com (free tier)
    if (!base64Image) {
      try {
        const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=XJSAFQT-W1D4NSP-Q1H8ZCC-NHG41R4&url=${encodeURIComponent(url)}&width=1920&height=1080&output=image&file_type=png&wait_for_event=load`;
        const response = await fetch(screenshotUrl);
        
        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          base64Image = btoa(
            new Uint8Array(imageBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );
        } else {
          lastError = `screenshotapi failed: ${response.status}`;
        }
      } catch (e) {
        lastError = `screenshotapi error: ${e instanceof Error ? e.message : 'Unknown'}`;
      }
    }

    // Option 3: Use urlbox (free tier available)
    if (!base64Image) {
      try {
        const urlboxUrl = `https://api.urlbox.io/v1/render?url=${encodeURIComponent(url)}&width=1920&height=1080&format=png`;
        const response = await fetch(urlboxUrl);
        
        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          base64Image = btoa(
            new Uint8Array(imageBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );
        } else {
          lastError = `urlbox failed: ${response.status}`;
        }
      } catch (e) {
        lastError = `urlbox error: ${e instanceof Error ? e.message : 'Unknown'}`;
      }
    }

    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: `Failed to capture screenshot. ${lastError}` }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
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
