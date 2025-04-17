import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const API_KEYS = {
  bing: Deno.env.get("BING_SEARCH_API_KEY"),
  serp: Deno.env.get("SERP_API_KEY"),
  tavily: Deno.env.get("TAVILY_API_KEY"),
  perplexity: Deno.env.get("PERPLEXITY_API_KEY"),
  openai: Deno.env.get("OPENAI_API_KEY"),
  google: Deno.env.get("GOOGLE_API_KEY"),
  anthropic: Deno.env.get("ANTHROPIC_API_KEY"),
  xai: Deno.env.get("XAI_API_KEY"),
  groq: Deno.env.get("GROQ_API_KEY")
};

interface SearchParams {
  query: string;
  provider: 'bing' | 'serp' | 'tavily' | 'perplexity' | 'openai' | 'anthropic' | 'xai' | 'groq' | 'google';
  options?: {
    includeImages?: boolean;
    includeNews?: boolean;
    recentOnly?: boolean;
    maxResults?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { query, provider, options = {} } = await req.json() as SearchParams;

    // Validate request
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameter: query" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate provider
    if (!provider || !Object.keys(API_KEYS).includes(provider)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing provider" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if provider API key is available
    if (!API_KEYS[provider]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API key for ${provider} not configured in environment variables` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Perform search based on provider
    let searchResults;
    switch (provider) {
      case "bing":
        searchResults = await searchWithBing(query, options, API_KEYS.bing);
        break;
      case "serp":
        searchResults = await searchWithSerp(query, options, API_KEYS.serp);
        break;
      case "tavily":
        searchResults = await searchWithTavily(query, options, API_KEYS.tavily);
        break;
      case "perplexity":
        searchResults = await searchWithPerplexity(query, API_KEYS.perplexity);
        break;
      case "openai":
        searchResults = await searchWithOpenAI(query, API_KEYS.openai);
        break;
      case "anthropic":
        searchResults = await searchWithAnthropic(query, API_KEYS.anthropic);
        break;
      case "xai":
        searchResults = await searchWithXAI(query, API_KEYS.xai);
        break;
      case "groq":
        searchResults = await searchWithGroq(query, API_KEYS.groq);
        break;
      case "google":
        searchResults = await searchWithGoogle(query, API_KEYS.google);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unsupported search provider" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
    }

    return new Response(
      JSON.stringify({ success: true, results: searchResults }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function searchWithBing(query: string, options: any, apiKey: string): Promise<any[]> {
  const searchType = options.includeImages ? 'Images,Web' : 'Web';
  const params = new URLSearchParams({
    q: query,
    count: String(options.maxResults || 10),
    responseFilter: searchType,
    freshness: options.recentOnly ? 'Day' : 'Month'
  });

  const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params}`, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Bing Search API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  const results = [
    {
      type: 'answer',
      content: `Here are the search results for "${query}":\n\n` + 
        (data.webPages?.value || []).map((page: any, i: number) => 
          `${i+1}. **${page.name}**\n${page.snippet}\n[${page.url}](${page.url})\n`
        ).join('\n'),
      timestamp: new Date().toISOString(),
      provider: 'Bing'
    }
  ];
  
  // Add web page sources
  if (data.webPages?.value) {
    data.webPages.value.forEach((page: any) => {
      results.push({
        type: 'source',
        title: page.name,
        content: page.snippet,
        url: page.url,
        timestamp: page.dateLastCrawled || new Date().toISOString()
      });
    });
  }
  
  // Add image sources if requested
  if (options.includeImages && data.images?.value) {
    data.images.value.forEach((image: any) => {
      results.push({
        type: 'image',
        title: image.name,
        content: image.contentUrl,
        url: image.hostPageUrl,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  return results;
}

async function searchWithSerp(query: string, options: any, apiKey: string): Promise<any[]> {
  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    num: String(options.maxResults || 10)
  });

  if (options.includeImages) {
    params.append('tbm', 'isch');
  }

  if (options.includeNews) {
    params.append('tbm', 'nws');
  }

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    throw new Error(`SERP API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  const results = [
    {
      type: 'answer',
      content: `Here are the search results for "${query}":`,
      timestamp: new Date().toISOString(),
      provider: 'SERP API'
    }
  ];
  
  // Add organic results
  if (data.organic_results) {
    data.organic_results.forEach((result: any) => {
      results.push({
        type: 'source',
        title: result.title,
        content: result.snippet,
        url: result.link,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  // Add knowledge graph if available
  if (data.knowledge_graph) {
    results.push({
      type: 'answer',
      content: `${data.knowledge_graph.title}: ${data.knowledge_graph.description || ''}`,
      timestamp: new Date().toISOString()
    });
  }
  
  return results;
}

async function searchWithTavily(query: string, options: any, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      query,
      search_depth: options.recentOnly ? 'basic' : 'advanced',
      include_images: options.includeImages,
      include_answer: true,
      max_results: options.maxResults || 10
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  const results = [];
  
  // Add answer if available
  if (data.answer) {
    results.push({
      type: 'answer',
      content: data.answer,
      timestamp: new Date().toISOString(),
      provider: 'Tavily'
    });
  }
  
  // Add sources
  if (data.results) {
    data.results.forEach((result: any) => {
      results.push({
        type: 'source',
        title: result.title,
        content: result.content,
        url: result.url,
        timestamp: result.published_date || new Date().toISOString()
      });
    });
  }
  
  return results;
}

async function searchWithPerplexity(query: string, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'sonar-reasoning-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant with search capabilities. Provide accurate and helpful information about the user\'s query.'
        },
        { 
          role: 'user', 
          content: query 
        }
      ],
      temperature: 0.5,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return [
    {
      type: 'answer',
      content,
      timestamp: new Date().toISOString(),
      provider: 'Perplexity'
    }
  ];
}

async function searchWithOpenAI(query: string, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. The user is asking a question that may require up-to-date information. Answer to the best of your ability based on your training data, but clearly state if the information might be outdated.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.5,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return [
    {
      type: 'answer',
      content,
      timestamp: new Date().toISOString(),
      provider: 'OpenAI',
      warningNote: 'This response is based on the AI model\'s training data and may not reflect the most current information.'
    }
  ];
}

async function searchWithAnthropic(query: string, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3.5-haiku-latest',
      messages: [
        { 
          role: 'user', 
          content: query 
        }
      ],
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  return [
    {
      type: 'answer',
      content,
      timestamp: new Date().toISOString(),
      provider: 'Anthropic',
      warningNote: 'This response is based on the AI model\'s training data and may not reflect the most current information.'
    }
  ];
}

async function searchWithXAI(query: string, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-3-mini-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant providing information in response to user queries.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.5,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    throw new Error(`X.AI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return [
    {
      type: 'answer',
      content,
      timestamp: new Date().toISOString(),
      provider: 'X.AI',
      warningNote: 'This response is based on the model\'s training data and may not reflect the most current information.'
    }
  ];
}

async function searchWithGroq(query: string, apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant providing information in response to user queries.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.5,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return [
    {
      type: 'answer',
      content,
      timestamp: new Date().toISOString(),
      provider: 'Groq',
      warningNote: 'This response is based on the model\'s training data and may not reflect the most current information.'
    }
  ];
}

async function searchWithGoogle(query: string, apiKey: string): Promise<any[]> {
  const baseUrl = "https://generativelanguage.googleapis.com/v1/models/";
  const model = "gemini-pro"; // Using appropriate Google model
  
  const response = await fetch(`${baseUrl}${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Please help me find information about: ${query}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Google Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No results found.';
  
  return [
    {
      type: 'answer',
      content,
      timestamp: new Date().toISOString(),
      provider: 'Google Gemini',
      warningNote: 'This response is based on the model\'s training data and may not reflect the most current information.'
    }
  ];
}