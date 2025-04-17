import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
  openai: "https://api.openai.com/v1/models",
  anthropic: "https://api.anthropic.com/v1/messages",
  groq: "https://api.groq.com/openai/v1/models",
  perplexity: "https://api.perplexity.ai/chat/models",
  xai: "https://api.x.ai/v1/models",
  google: "https://generativelanguage.googleapis.com/v1/models",
  serp: "https://serpapi.com/account",
  bing: "https://api.bing.microsoft.com/v7.0/search",
  together: "https://api.together.ai/v1/models",
  tavily: "https://api.tavily.com/v1/models"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { provider } = await req.json();

    // Validate request parameters
    if (!provider) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required parameter: provider" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if provider is supported
    if (!BASE_URLS[provider]) {
      return new Response(
        JSON.stringify({ success: false, message: `Provider '${provider}' not supported` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if API key is available
    if (!API_KEYS[provider]) {
      return new Response(
        JSON.stringify({ success: false, message: `API key for '${provider}' not configured in environment variables` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Set up headers with API key and build request options
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header based on provider
    if (provider === "anthropic") {
      headers["X-API-Key"] = API_KEYS[provider];
      headers["anthropic-version"] = "2023-06-01";
    } else if (provider === "google" || provider === "serp" || provider === "tavily") {
      // Google and SERP use query parameters for API key, handled below
    } else if (provider === "bing") {
      headers["Ocp-Apim-Subscription-Key"] = API_KEYS[provider];
    } else {
      headers["Authorization"] = `Bearer ${API_KEYS[provider]}`;
    }

    // Build the URL with query parameters if needed
    let url = BASE_URLS[provider];
    if (provider === "google") {
      url = `${url}?key=${API_KEYS[provider]}`;
    } else if (provider === "serp") {
      url = `${url}?api_key=${API_KEYS[provider]}`;
    } else if (provider === "tavily") {
      url = `${url}?api_key=${API_KEYS[provider]}`;
    } else if (provider === "bing") {
      url = `${url}?q=test`;
    }

    // For Anthropic, we need a small request body
    const body = provider === "anthropic" ? 
      JSON.stringify({
        model: "claude-3.5-haiku-latest",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }]
      }) : undefined;

    const method = provider === "anthropic" ? "POST" : "GET";

    // Test the connection
    const response = await fetch(url, {
      method,
      headers,
      body,
      // Set a timeout to avoid hanging
      signal: AbortSignal.timeout(10000),
    });

    // Report test results
    return new Response(
      JSON.stringify({
        success: response.ok,
        message: response.ok 
          ? `Successfully connected to ${provider} API` 
          : `Failed to connect to ${provider} API: ${response.status} ${response.statusText}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`Connection test error: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error testing connection: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});