import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIClient } from '../../lib/api-client';
import { ModelRouter } from '../../lib/routing/router';

// Mock dependencies
vi.mock('../../lib/routing/router', () => ({
  ModelRouter: vi.fn().mockImplementation(() => ({
    route: vi.fn().mockResolvedValue({
      model: 'gpt-4o',
      maxTokens: 8192,
      temperature: 0.7,
      confidence: 0.9,
    })
  }))
}));

vi.mock('../../lib/config', () => ({
  useConfigStore: {
    getState: vi.fn().mockReturnValue({
      apiKeys: {
        openai: 'test-openai-key',
        groq: 'test-groq-key'
      }
    }),
    setState: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  }
}));

vi.mock('../../lib/api/openai-api', () => ({
  OpenAIAPI: {
    getInstance: vi.fn().mockReturnValue({
      chat: vi.fn().mockResolvedValue('OpenAI response')
    })
  }
}));

vi.mock('../../core/supabase/supabase-client', () => ({
  getNetworkStatus: vi.fn(() => true),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('APIClient', () => {
  let apiClient: APIClient;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup fetch mock for different responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('openai')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: 'OpenAI test result' } }] })
        });
      }
      if (url.includes('groq')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: 'Groq test result' } }] })
        });
      }
      
      // Default response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
    
    // Get singleton instance
    apiClient = APIClient.getInstance();
  });
  
  describe('initialization', () => {
    it('should initialize correctly', async () => {
      await apiClient.initialize();
      expect(apiClient['initialized']).toBe(true);
    });
    
    it('should handle edge functions configuration', () => {
      apiClient.setUseEdgeFunctions(true);
      expect(apiClient['useEdgeFunctions']).toBe(true);
      
      apiClient.setUseEdgeFunctions(false);
      expect(apiClient['useEdgeFunctions']).toBe(false);
    });
  });
  
  describe('test connection', () => {
    it('should test connection to provider', async () => {
      const result = await apiClient.testConnection('openai');
      
      expect(result.success).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('openai'), expect.any(Object));
    });
    
    it('should handle missing API key', async () => {
      const { useConfigStore } = require('../../lib/config');
      useConfigStore.getState.mockReturnValueOnce({
        apiKeys: { openai: '' }
      });
      
      const result = await apiClient.testConnection('openai');
      
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('No API key configured');
    });
  });
  
  describe('chat', () => {
    it('should process chat requests successfully', async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
      ];
      
      const result = await apiClient.chat(messages);
      
      expect(result).toBeTruthy();
      expect(ModelRouter.prototype.route).toHaveBeenCalled();
    });
    
    it('should handle progress callbacks', async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
      ];
      
      const progressCallback = vi.fn();
      
      // Mock a streaming response
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Test"}}]}\n\n'));
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":" content"}}]}\n\n'));
          controller.close();
        }
      });
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: mockBody
      });
      
      await apiClient.chat(messages, progressCallback);
      
      expect(progressCallback).toHaveBeenCalled();
    });
    
    it('should fall back to alternative provider on failure', async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
      ];
      
      // Mock first provider to fail
      (global.fetch as any).mockRejectedValueOnce(new Error('API error'));
      
      // Mock fallback to succeed
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'Fallback result' } }] })
      });
      
      const result = await apiClient.chat(messages);
      
      expect(result).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});