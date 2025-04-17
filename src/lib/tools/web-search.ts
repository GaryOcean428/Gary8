import { useConfigStore } from '../config';

export class WebSearch {
  private configStore = useConfigStore;

  constructor() {}

  async search(query: string): Promise<string> {
    try {
      const apiKeys = this.configStore.getState().apiKeys;
      
      if (!apiKeys.groq) {
        throw new Error('Groq API key not configured');
      }

      const response = await fetch('https://api.perplexity.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.groq}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-groq-70b-8192-tool-use-preview',
          messages: [
            {
              role: 'user',
              content: `Search the internet and provide current information about: ${query}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Search API returned status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No results found.';
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error('Failed to perform web search');
    }
  }

  async fetchContent(url: string): Promise<string> {
    try {
      const apiKeys = this.configStore.getState().apiKeys;
      
      if (!apiKeys.groq) {
        throw new Error('Groq API key not configured');
      }

      const response = await fetch('https://api.perplexity.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.groq}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-groq-70b-8192-tool-use-preview',
          messages: [
            {
              role: 'user',
              content: `Please fetch and summarize the content from this URL: ${url}`
            }
          ],
          temperature: 0.5,
          max_tokens: 1024,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Content fetch API returned status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Failed to fetch content.';
    } catch (error) {
      console.error('Content fetch error:', error);
      throw new Error('Failed to fetch content');
    }
  }
}