// Follow Deno Edge Function pattern for Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Define the API keys interface
interface ApiKeys {
  groq?: string;
  perplexity?: string;
  anthropic?: string;
  openai?: string;
  xai?: string;
  google?: string;
  serp?: string;
  bing?: string;
  tavily?: string;
  together?: string;
}

// Define the response interface
interface ApiResponse {
  success: boolean;
  data?: ApiKeys;
  error?: string;
}

// Create a handler for the API keys endpoint
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    
    // Check if the authorization header is present
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Missing or invalid authorization header"
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Get the API keys from environment variables
    const apiKeys: ApiKeys = {
      groq: Deno.env.get("GROQ_API_KEY"),
      perplexity: Deno.env.get("PERPLEXITY_API_KEY"),
      anthropic: Deno.env.get("ANTHROPIC_API_KEY"),
      openai: Deno.env.get("OPENAI_API_KEY"),
      xai: Deno.env.get("XAI_API_KEY"),
      google: Deno.env.get("GOOGLE_API_KEY"),
      serp: Deno.env.get("SERP_API_KEY"),
      bing: Deno.env.get("BING_SEARCH_API_KEY"),
      tavily: Deno.env.get("TAVILY_API_KEY"),
      together: Deno.env.get("TOGETHER_API_KEY")
    };

    // Check if any key exists
    const hasKeys = Object.values(apiKeys).some(key => !!key);
    
    if (!hasKeys) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No API keys are configured in the environment variables"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Return the API keys
    const response: ApiResponse = {
      success: true,
      data: apiKeys
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    // Return an error response
    const response: ApiResponse = {
      success: false,
      error: error.message || "An unknown error occurred"
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});