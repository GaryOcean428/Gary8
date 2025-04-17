import { XAI_CONFIG } from './config';
import { Memory } from './memory';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const memory = new Memory();

export interface APIRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function makeAPIRequest(
  endpoint: string,
  options: APIRequestOptions = {}
) {
  const { method = 'GET', headers = {}, body } = options;

  try {
    const response = await fetch(`${XAI_CONFIG.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      throw new APIError(
        'API request failed',
        response.status,
        await response.text()
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(
      error instanceof Error ? error.message : 'API request failed'
    );
  }
}

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  onProgress?: (content: string) => void
) {
  try {
    const context = await memory.getRelevantMemories(messages[0].content);
    
    const systemMessage = {
      role: 'system',
      content: `You are Agent One, an AI assistant. Here is the context from previous conversations:\n\n${context}`
    };

    const response = await fetch(`${XAI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        messages: [systemMessage, ...messages],
        model: XAI_CONFIG.defaultModel,
        stream: Boolean(onProgress),
        temperature: XAI_CONFIG.temperature,
        max_tokens: XAI_CONFIG.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new APIError(
        'Chat API request failed',
        response.status,
        await response.text()
      );
    }

    if (onProgress && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let responseContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                responseContent += content;
                onProgress(content);
              }
            } catch (e) {
              console.error('Failed to parse streaming response:', e);
            }
          }
        }
      }

      await memory.store(messages[0], {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now()
      });

      return;
    }

    const data = await response.json();
    const responseContent = data.choices[0]?.message?.content || '';

    await memory.store(messages[0], {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now()
    });

    return responseContent;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(
      error instanceof Error ? error.message : 'Chat request failed'
    );
  }
}

export async function createEmbeddings(text: string) {
  return makeAPIRequest('/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_CONFIG.apiKey}`,
    },
    body: {
      input: text,
      model: XAI_CONFIG.embeddingModel,
    },
  });
}