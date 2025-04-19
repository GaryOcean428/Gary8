/**
 * Helper functions for working with OpenAI APIs
 */

import { thoughtLogger } from '../logging/thought-logger';

/**
 * Convert messages to chat completion format
 */
export function messagesToChatCompletionFormat(_messages: Array<{ role: string; content: string }>): any {
  return _messages.map(({ role, content }) => ({ role, content }));
}

/**
 * Convert messages to the Responses API input format
 */
export function messagesToResponsesInputFormat(_messages: Array<{ role: string; content: string }>): any {
  // If there's only one message, return it directly
  if (_messages.length === 1) {
    return { role: _messages[0].role, content: _messages[0].content };
  }
  
  // For multiple messages, return the array
  return _messages.map(({ role, content }) => ({ role, content }));
}

/**
 * Extract content text from a Responses API response
 */
export function extractResponsesContent(_response: unknown): string {
  try {
    // First, try the convenience helper
    if ('output_text' in _response) {
      return _response.output_text;
    }
    
    // If not available, manually extract from output array
    if (_response.output) {
      for (const item of _response.output) {
        if (item.type === 'message' && item.role === 'assistant' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text' || content.type === 'text') {
              return content.text;
            }
          }
        }
      }
    }
    
    // Fallback to logging the response and returning empty
    thoughtLogger.log('error', 'Failed to extract content from Responses API response', {
      responseStructure: JSON.stringify(_response)
    });
    
    return '';
  } catch (error) {
    thoughtLogger.log('error', 'Error extracting content from Responses API', { error });
    return '';
  }
}

/**
 * Convert Chat Completions function calling to Responses API tool calling format
 */
export function convertFunctionsToTools(_functions: any[]): Record<string, unknown> {
  const tools: Record<string, unknown> = {};
  
  for (const fn of _functions) {
    tools[fn.name] = {
      description: fn.description,
      parameters: fn.parameters
    };
  }
  
  return tools;
}

/**
 * Parse function call from response text
 */
export function parseFunctionCall(_responseText: string): { name: string; arguments: unknown } | null {
  try {
    // Look for JSON in code blocks
    const functionCallMatch = _responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
    if (functionCallMatch && functionCallMatch[1]) {
      const parsed = JSON.parse(functionCallMatch[1]);
      if (parsed.function || parsed.name) {
        return {
          name: parsed.function || parsed.name,
          arguments: parsed.arguments || parsed.params || {}
        };
      }
    }
    
    // Try parsing the whole response as JSON
    try {
      const parsed = JSON.parse(_responseText);
      if (parsed.function_call || parsed.function) {
        const functionCall = parsed.function_call || parsed;
        return {
          name: functionCall.name || functionCall.function,
          arguments: typeof functionCall.arguments === 'string' 
            ? JSON.parse(functionCall.arguments) 
            : functionCall.arguments || {}
        };
      }
    } catch (e) {
      // Ignore parse errors for whole response
    }
    
    return null;
  } catch (error) {
    thoughtLogger.log('error', 'Failed to parse function call', { error, _responseText });
    return null;
  }
}

/**
 * Check if a model is compatible with the Responses API
 */
export function isResponsesCompatibleModel(_model: string): boolean {
  const compatibleModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o1-mini',
    'o3-mini',
    'chatgpt-4o-latest'
  ];
  
  return compatibleModels.some(_compatibleModel => 
    _model.includes(_compatibleModel)
  );
}