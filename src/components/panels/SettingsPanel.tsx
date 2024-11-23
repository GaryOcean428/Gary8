'use client';

import { Card, Switch, Select, SelectItem, Input } from '@nextui-org/react';

export function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Agent Settings</h2>

      {/* Agent Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Configuration</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Auto-Recovery</h4>
              <p className="text-sm text-gray-500">Automatically recover from errors</p>
            </div>
            <Switch defaultSelected />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Human Oversight</h4>
              <p className="text-sm text-gray-500">Require approval for critical actions</p>
            </div>
            <Switch defaultSelected />
          </div>

          <div>
            <h4 className="font-medium mb-2">Default Model</h4>
            <Select 
              label="Select Model"
              defaultSelectedKeys={["grok-beta"]}
            >
              <SelectItem key="grok-beta" value="grok-beta">Grok Beta</SelectItem>
              <SelectItem key="claude-3" value="claude-3">Claude 3</SelectItem>
              <SelectItem key="perplexity" value="perplexity">Perplexity</SelectItem>
            </Select>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Security & Permissions</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Sandbox Mode</h4>
              <p className="text-sm text-gray-500">Run agents in isolated environment</p>
            </div>
            <Switch defaultSelected />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">File System Access</h4>
              <p className="text-sm text-gray-500">Allow file system operations</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Performance Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Concurrent Tasks</h4>
            <Input 
              type="number" 
              defaultValue="3"
              min="1"
              max="10"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Memory Limit</h4>
            <Select defaultSelectedKeys={["4gb"]}>
              <SelectItem key="2gb" value="2gb">2GB</SelectItem>
              <SelectItem key="4gb" value="4gb">4GB</SelectItem>
              <SelectItem key="8gb" value="8gb">8GB</SelectItem>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}