import React from 'react';
import { useStore } from '../../store';
import { Github, Key, Lock } from 'lucide-react';

const AVAILABLE_SCOPES = ['repo', 'read:user', 'read:org', 'workflow'] as const;
type GitHubScope = typeof AVAILABLE_SCOPES[number];

export function GitHubSettings() {
  const { githubConfig, setGithubConfig } = useStore();

  const handleScopeChange = (scope: GitHubScope, checked: boolean) => {
    const newScopes = checked
      ? [...githubConfig.scopes, scope]
      : githubConfig.scopes.filter((s: string) => s !== scope);
    setGithubConfig({ ...githubConfig, scopes: newScopes });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Github className="w-5 h-5" />
        <h3 className="text-lg font-medium">GitHub Integration</h3>
      </div>

      <div className="space-y-4">
        {/* Personal Access Token */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Personal Access Token
            <span className="text-foreground/60 ml-2">Required for repository access</span>
          </label>
          <div className="relative">
            <input
              type="password"
              value={githubConfig.token}
              onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
              placeholder="Enter GitHub token"
              className="w-full bg-secondary rounded-lg pl-10 pr-3 py-2 text-sm"
            />
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* API Version */}
        <div>
          <label className="block text-sm font-medium mb-2">
            API Version
          </label>
          <input
            type="text"
            value={githubConfig.apiVersion}
            onChange={(e) => setGithubConfig({ ...githubConfig, apiVersion: e.target.value })}
            placeholder="API Version (e.g., 2022-11-28)"
            className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Required Scopes */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Required Scopes
          </h4>
          <div className="space-y-2">
            {AVAILABLE_SCOPES.map((scope) => (
              <div key={scope} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={scope}
                  checked={githubConfig.scopes.includes(scope)}
                  onChange={(e) => handleScopeChange(scope, e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor={scope} className="text-sm">{scope}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Base URL (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Base URL
            <span className="text-foreground/60 ml-2">Optional</span>
          </label>
          <input
            type="text"
            value={githubConfig.baseUrl || ''}
            onChange={(e) => setGithubConfig({ ...githubConfig, baseUrl: e.target.value })}
            placeholder="Custom API base URL (optional)"
            className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Documentation Links */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Documentation</h4>
          <div className="space-y-2 text-sm">
            <a 
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              GitHub REST API Documentation
            </a>
            <a 
              href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              Managing Personal Access Tokens
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
