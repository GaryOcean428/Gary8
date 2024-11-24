'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Shield, 
  Cpu, 
  Network, 
  Database,
  Key,
  Save
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [isDirty, setIsDirty] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(settings);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 bg-background/95">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h2>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty}
          className="flex items-center gap-1"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Theme</span>
                <Select
                  value={theme}
                  onValueChange={(value) => setTheme(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Enable Analytics</span>
                  <p className="text-sm text-muted-foreground">
                    Collect anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('analyticsEnabled', checked)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Agent Configuration</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Auto-Recovery</span>
                  <p className="text-sm text-muted-foreground">
                    Automatically recover from errors
                  </p>
                </div>
                <Switch
                  checked={settings.autoRecoveryEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange('autoRecoveryEnabled', checked)
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Parallel Execution</span>
                  <p className="text-sm text-muted-foreground">
                    Run compatible tasks in parallel
                  </p>
                </div>
                <Switch
                  checked={settings.parallelExecutionEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange('parallelExecutionEnabled', checked)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              {['groq', 'anthropic', 'perplexity'].map((provider) => (
                <div key={provider} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {provider} API Key
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={settings[`${provider}ApiKey`] || ''}
                      onChange={(e) => 
                        handleSettingChange(`${provider}ApiKey`, e.target.value)
                      }
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon">
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Require Authentication</span>
                  <p className="text-sm text-muted-foreground">
                    Enable authentication for all operations
                  </p>
                </div>
                <Switch
                  checked={settings.authRequired}
                  onCheckedChange={(checked) =>
                    handleSettingChange('authRequired', checked)
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">API Rate Limiting</span>
                  <p className="text-sm text-muted-foreground">
                    Enable rate limiting for API calls
                  </p>
                </div>
                <Switch
                  checked={settings.rateLimitingEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange('rateLimitingEnabled', checked)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}