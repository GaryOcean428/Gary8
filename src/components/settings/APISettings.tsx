import React from 'react';
import { useStore } from '../../store';
import { config } from '../../config';

export function APISettings() {
  const { apiKeys, setApiKey } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">API Configuration</h3>
        
        <div className="space-y-4">
          {/* X.AI API Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              X.AI API Key
              <span className="text-foreground/60 ml-2">Required for Grok models</span>
            </label>
            <input
              type="password"
              value={apiKeys.xai}
              onChange={(e) => setApiKey('xai', e.target.value)}
              placeholder="Enter X.AI API key"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Groq API Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Groq API Key
              <span className="text-foreground/60 ml-2">Required for Llama models</span>
            </label>
            <input
              type="password"
              value={apiKeys.groq}
              onChange={(e) => setApiKey('groq', e.target.value)}
              placeholder="Enter Groq API key"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Perplexity API Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Perplexity API Key
              <span className="text-foreground/60 ml-2">Required for Sonar models</span>
            </label>
            <input
              type="password"
              value={apiKeys.perplexity}
              onChange={(e) => setApiKey('perplexity', e.target.value)}
              placeholder="Enter Perplexity API key"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Hugging Face Token */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Hugging Face Token
              <span className="text-foreground/60 ml-2">Required for Granite models</span>
            </label>
            <input
              type="password"
              value={apiKeys.huggingface}
              onChange={(e) => setApiKey('huggingface', e.target.value)}
              placeholder="Enter Hugging Face token"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* API Documentation */}
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-2">API Documentation</h4>
            <div className="space-y-2 text-sm text-foreground/60">
              <p>
                Get your API keys from the following providers:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <a 
                    href="https://docs.x.ai/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    X.AI API Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://console.groq.com/docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Groq API Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.perplexity.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Perplexity API Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://huggingface.co/docs/api-inference" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Hugging Face API Documentation
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}