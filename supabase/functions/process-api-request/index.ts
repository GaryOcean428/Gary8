import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface ApiRequestBody {
  provider: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

const API_KEYS = {
  openai: Deno.env.get("OPENAI_API_KEY"),
  anthropic: Deno.env.get("ANTHROPIC_API_KEY"),
  groq: Deno.env.get("GROQ_API_KEY"),
  perplexity: Deno.env.get("PERPLEXITY_API_KEY"),
  xai: Deno.env.get("XAI_API_KEY"),
  google: Deno.env.get("GOOGLE_API_KEY"),
  serp: Deno.env.get("SERP_API_KEY"),
  bing: Deno.env.get("BING_SEARCH_API_KEY"),
  together: Deno.env.get("TOGETHER_API_KEY"),
  tavily: Deno.env.get("TAVILY_API_KEY")
};

const BASE_URLS = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  groq: "https://api.groq.com/openai/v1",
  perplexity: "https://api.perplexity.ai",
  xai: "https://api.x.ai/v1",
  google: "https://generativelanguage.googleapis.com/v1",
  serp: "https://serpapi.com",
  bing: "https://api.bing.microsoft.com",
  together: "https://api.together.ai/v1",
  tavily: "https://api.tavily.com/v1"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { provider, endpoint, method, headers = {}, body } = await req.json() as ApiRequestBody;

    // Validate request parameters
    if (!provider || !endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: provider or endpoint" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if provider is supported
    if (!BASE_URLS[provider]) {
      return new Response(
        JSON.stringify({ error: `Provider '${provider}' not supported` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if API key is available
    if (!API_KEYS[provider]) {
      return new Response(
        JSON.stringify({ error: `API key for '${provider}' not configured in environment variables` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the request URL
    const url = `${BASE_URLS[provider]}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    // Set up headers with API key
    const requestHeaders: Record<string, string> = {
      ...headers,
      "Content-Type": "application/json",
    };

    // Add authorization header based on provider requirements
    if (provider === "anthropic") {
      requestHeaders["X-API-Key"] = API_KEYS[provider];
      requestHeaders["anthropic-version"] = "2023-06-01";
    } else if (provider === "google" || provider === "serp" || provider === "tavily") {
      // Google API uses the key as a query parameter, handled below
    } else if (provider === "bing") {
      requestHeaders["Ocp-Apim-Subscription-Key"] = API_KEYS[provider];
    } else {
      requestHeaders["Authorization"] = `Bearer ${API_KEYS[provider]}`;
    }

    // Build the full URL with query parameters if needed
    let requestUrl = url;
    if (provider === "google") {
      const separator = requestUrl.includes("?") ? "&" : "?";
      requestUrl = `${requestUrl}${separator}key=${API_KEYS[provider]}`;
    }
    
    if (provider === "serp") {
      const separator = requestUrl.includes("?") ? "&" : "?";
      requestUrl = `${requestUrl}${separator}api_key=${API_KEYS[provider]}`;
    }
    
    if (provider === "tavily") {
      const separator = requestUrl.includes("?") ? "&" : "?";
      requestUrl = `${requestUrl}${separator}api_key=${API_KEYS[provider]}`;
    }

    // Make the actual API request
    const apiResponse = await fetch(requestUrl, {
      method: method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      // Set a timeout to avoid hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    // Stream the response if it's a streaming request
    if (body?.stream && apiResponse.body) {
      return new Response(apiResponse.body, {
        status: apiResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Return the response as JSON
    const data = await apiResponse.json();
    return new Response(JSON.stringify(data), {
      status: apiResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`API request error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        name: error.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});