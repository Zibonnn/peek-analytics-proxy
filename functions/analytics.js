import fetch from "node-fetch";

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { measurement_id, event_name, event_params } = JSON.parse(event.body);

    // Validate the request
    if (!measurement_id || !event_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    // Your GA4 API secret (set this in Netlify environment variables)
    const GA4_API_SECRET = process.env.GA4_API_SECRET;

    if (!GA4_API_SECRET) {
      console.error("GA4_API_SECRET environment variable not set");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error" })
      };
    }

    // Prepare the GA4 payload
    const ga4Payload = {
      client_id: `extension-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      events: [{
        name: event_name,
        params: {
          ...event_params,
          engagement_time_msec: 100
        }
      }]
    };

    console.log(`📊 Sending event to GA4: ${event_name}`, ga4Payload);

    // Send to Google Analytics 4
    const ga4Response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${GA4_API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify(ga4Payload),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!ga4Response.ok) {
      const errorText = await ga4Response.text();
      throw new Error(`GA4 request failed: ${ga4Response.status} ${ga4Response.statusText} - ${errorText}`);
    }

    console.log(`✅ Event tracked successfully: ${event_name}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Event tracked successfully",
        event: event_name,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("❌ Analytics error:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to track event",
        details: error.message
      })
    };
  }
};
