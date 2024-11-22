'use client';

import { useState } from 'react';
import { toolhouse, llmCall } from '@/lib/toolhouse-client';
import type { Messages } from '@anthropic-ai/sdk';

export default function ToolhouseDemo() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleToolhouseQuery = async () => {
    try {
      setLoading(true);
      
      const messages: Messages.MessageParam[] = [{
        role: 'user',
        content: 'Get the contents of https://toolhouse.ai and summarize its key value propositions in three bullet points.'
      }];

      // First call to get tool results
      const response = await llmCall(messages);
      
      // Run tools and append results to messages
      const toolResults = await toolhouse.runTools(response) as Messages.MessageParam[];
      const updatedMessages = [...messages, ...toolResults];
      
      // Final call with tool results
      const finalResponse = await llmCall(updatedMessages);
      setResult(finalResponse.content[0].text);
      
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleToolhouseQuery}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Run Toolhouse Query'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
} 