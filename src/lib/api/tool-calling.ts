import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';
import { OpenAIAPI } from './openai-api';
import type { Message } from '../types';

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface FunctionCallResult {
  name: string;
  arguments: Record<string, unknown>;
  responseMessage: Message;
}

export class ToolCallingAPI {
  private static instance: ToolCallingAPI;
  private openai: OpenAIAPI;
  
  private constructor() {
    this.openai = OpenAIAPI.getInstance();
  }
  
  static getInstance(): ToolCallingAPI {
    if (!ToolCallingAPI.instance) {
      ToolCallingAPI.instance = new ToolCallingAPI();
    }
    return ToolCallingAPI.instance;
  }
  
  /**
   * Makes a tool calling request using either the Responses or Chat Completions API
   * @param _apiKey The OpenAI API key
   * @param _messages Messages to provide context
   * @param _tools Tools/functions to make available to the model
   * @returns The function call results
   */
  async callTool(
    _apiKey: string,
    _messages: Message[],
    _tools: Tool[],
    _modelName: string = 'gpt-4o'
  ): Promise<FunctionCallResult | null> {
    thoughtLogger.log('execution', 'Making tool calling request', { toolCount: _tools.length });
    
    try {
      // Format tools for the Responses API
      const toolsFormatted = _tools.reduce((_acc, _tool) => {
        _acc[_tool.name] = {
          description: _tool.description,
          parameters: _tool.parameters
        };
        return _acc;
      }, {} as Record<string, unknown>);
      
      // Make the API call
      const response = await this.openai.chat(
        _messages,
        _apiKey,
        {
          model: _modelName,
          tools: toolsFormatted,
          temperature: 0
        }
      );
      
      // Parse the response for tool calls
      // This currently assumes the output from Chat Completions format
      // TODO: Update for Responses API format
      const functionCallMatch = response.match(/```json\s*({[\s\S]*?})\s*```/);
      if (functionCallMatch && functionCallMatch[1]) {
        try {
          const parsedCall = JSON.parse(functionCallMatch[1]);
          return {
            name: parsedCall.function || parsedCall.name,
            arguments: parsedCall.arguments || parsedCall.params || {},
            responseMessage: {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            }
          };
        } catch (parseError) {
          thoughtLogger.log('error', 'Failed to parse function call JSON', { parseError });
        }
      }
      
      // Check for direct function call format
      if (response.includes('function_call') || response.includes('"function":')) {
        try {
          // First try to parse the whole response
          const parsedResponse = JSON.parse(response);
          if (parsedResponse.function_call || parsedResponse.function) {
            const functionCall = parsedResponse.function_call || parsedResponse;
            return {
              name: functionCall.function || functionCall.name,
              arguments: functionCall.arguments || functionCall.params || {},
              responseMessage: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: response,
                timestamp: Date.now()
              }
            };
          }
        } catch (parseError) {
          // Ignore parse error for whole response
        }
      }
      
      // No valid function call found
      return null;
    } catch (error) {
      thoughtLogger.log('error', 'Tool calling failed', { error });
      throw error instanceof AppError ? error : new AppError(
        'Failed to make tool calling request',
        'TOOL_ERROR',
        { originalError: error }
      );
    }
  }
}