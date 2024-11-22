import React from 'react';
import { useStore } from '../../store';
import { Database, Key, Shield, Server } from 'lucide-react';

export function FirebaseSettings() {
  const { firebaseConfig, setFirebaseConfig } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-5 h-5" />
        <h3 className="text-lg font-medium">Firebase Configuration</h3>
      </div>

      <div className="space-y-4">
        {/* Project Configuration */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Project Settings
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={firebaseConfig?.projectId || ''}
                onChange={(e) => setFirebaseConfig({
                  ...firebaseConfig,
                  projectId: e.target.value
                })}
                placeholder="your-project-id"
                className="w-full bg-background rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                API Key
                <span className="text-foreground/60 ml-2">Required for authentication</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={firebaseConfig?.apiKey || ''}
                  onChange={(e) => setFirebaseConfig({
                    ...firebaseConfig,
                    apiKey: e.target.value
                  })}
                  placeholder="Enter Firebase API key"
                  className="w-full bg-background rounded-lg pl-10 pr-3 py-2 text-sm"
                />
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Settings */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Authentication Settings
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={firebaseConfig?.authDomain || ''}
                onChange={(e) => setFirebaseConfig({
                  ...firebaseConfig,
                  authDomain: e.target.value
                })}
                placeholder="your-project-id.firebaseapp.com"
                className="w-full bg-background rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Storage Bucket
              </label>
              <input
                type="text"
                value={firebaseConfig?.storageBucket || ''}
                onChange={(e) => setFirebaseConfig({
                  ...firebaseConfig,
                  storageBucket: e.target.value
                })}
                placeholder="your-project-id.appspot.com"
                className="w-full bg-background rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Messaging Sender ID
              </label>
              <input
                type="text"
                value={firebaseConfig?.messagingSenderId || ''}
                onChange={(e) => setFirebaseConfig({
                  ...firebaseConfig,
                  messagingSenderId: e.target.value
                })}
                placeholder="Enter sender ID"
                className="w-full bg-background rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                App ID
              </label>
              <input
                type="text"
                value={firebaseConfig?.appId || ''}
                onChange={(e) => setFirebaseConfig({
                  ...firebaseConfig,
                  appId: e.target.value
                })}
                placeholder="Enter app ID"
                className="w-full bg-background rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Documentation</h4>
          <div className="space-y-2 text-sm">
            <a 
              href="https://firebase.google.com/docs/web/setup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              Firebase Web Setup Guide
            </a>
            <a 
              href="https://firebase.google.com/docs/projects/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              Understanding Firebase API Keys
            </a>
            <a 
              href="https://firebase.google.com/docs/auth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              Firebase Authentication
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
