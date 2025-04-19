import React, { useState, useEffect } from 'react';
import { Settings, Server, PenTool as Tool, Cpu, FileCode, Check, X, AlertCircle, Monitor, Loader } from 'lucide-react';
import { useToast } from '../../shared/hooks/useToast';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { getNetworkStatus } from '../../core/supabase/supabase-client';

interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  capabilities: {
    resources: boolean;
    prompts: boolean;
    tools: boolean;
    sampling: boolean;
  };
  status: 'connected' | 'disconnected' | 'initializing';
}

export function MCPConfig() {
  const [servers, setServers] = useLocalStorage<MCPServerConfig[]>('mcp_servers', defaultServers);
  const [activeServer, setActiveServer] = useState<MCPServerConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  // When component loads, check connection status for all enabled servers
  useEffect(() => {
    if (!getNetworkStatus()) {
      // Update all servers to disconnected if offline
      setServers(servers.map(_server => ({
        ..._server,
        status: 'disconnected'
      })));
      setIsLoading(false);
      return;
    }

    const checkServers = async () => {
      setIsLoading(true);
      const updatedServers = [...servers];

      for (let i = 0; i < updatedServers.length; i++) {
        if (updatedServers[i].enabled) {
          try {
            // Simulate server connection check (in real app this would actually connect)
            await new Promise(_resolve => setTimeout(_resolve, 500 + Math.random() * 500));
            const success = Math.random() > 0.3; // Simulate 70% success rate for demo
            
            updatedServers[i].status = success ? 'connected' : 'disconnected';
          } catch (error) {
            updatedServers[i].status = 'disconnected';
          }
        } else {
          updatedServers[i].status = 'disconnected';
        }
      }

      setServers(updatedServers);
      setIsLoading(false);
    };

    checkServers();
  }, []);

  const toggleServerEnabled = (_serverId: string) => {
    setServers(
      servers.map(_server => 
        _server.id === _serverId 
          ? { ..._server, enabled: !_server.enabled, status: !_server.enabled ? 'initializing' : 'disconnected' } 
          : _server
      )
    );

    // If enabling, simulate connection process
    const server = servers.find(_s => _s.id === _serverId);
    if (server && !server.enabled) {
      setTimeout(() => {
        setServers(_prevServers => 
          _prevServers.map(_s => 
            _s.id === _serverId 
              ? { ..._s, status: Math.random() > 0.3 ? 'connected' : 'disconnected' } // 70% success rate
              : _s
          )
        );

        // Show toast
        addToast({
          type: Math.random() > 0.3 ? 'success' : 'error',
          message: Math.random() > 0.3 
            ? `Successfully connected to ${server.name}` 
            : `Failed to connect to ${server.name}`,
          duration: 3000
        });
      }, 1500);
    }
  };

  const handleServerClick = (_server: MCPServerConfig) => {
    setActiveServer(_server);
    setIsEditing(false);
  };

  // Displays capabilities in a readable format
  const getCapabilities = (_server: MCPServerConfig) => {
    const caps = [];
    if (_server.capabilities.resources) caps.push('Resources');
    if (_server.capabilities.prompts) caps.push('Prompts');
    if (_server.capabilities.tools) caps.push('Tools');
    if (_server.capabilities.sampling) caps.push('Sampling');
    return caps.join(', ');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Model Context Protocol</h2>
          <p className="text-muted-foreground">Manage MCP servers and integrations</p>
        </div>
        <div>
          <Button 
            variant="default" 
            onClick={() => setIsConfiguring(!isConfiguring)}
            leftIcon={<Settings size={16} />}
          >
            {isConfiguring ? 'Done' : 'Configure'}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Server list */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-lg font-medium mb-3">MCP Servers</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map(_server => (
                <div 
                  key={_server.id} 
                  className={`p-4 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors ${activeServer?.id === _server.id ? 'bg-muted border-primary' : 'bg-card'}`}
                  onClick={() => handleServerClick(_server)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">{_server.name}</span>
                    </div>
                    <Badge 
                      variant={_server.status === 'connected' ? 'success' : _server.status === 'initializing' ? 'secondary' : 'destructive'}
                      animation={_server.status === 'initializing' ? 'pulse' : 'none'}
                    >
                      {_server.status === 'connected' ? (
                        <Check size={12} className="mr-1" />
                      ) : _server.status === 'initializing' ? (
                        <Loader size={12} className="animate-spin mr-1" />
                      ) : (
                        <X size={12} className="mr-1" />
                      )}
                      {_server.status === 'connected' ? 'Connected' : _server.status === 'initializing' ? 'Connecting...' : 'Disconnected'}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center mt-1">
                      <Cpu className="h-3 w-3 mr-1" />
                      <span>{getCapabilities(_server)}</span>
                    </div>
                    {isConfiguring && (
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs opacity-70 truncate max-w-40">{_server.url}</span>
                        <Button 
                          variant={_server.enabled ? "success" : "outline"} 
                          size="xs"
                          onClick={(_e) => {
                            _e.stopPropagation();
                            toggleServerEnabled(_server.id);
                          }}
                        >
                          {_server.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isConfiguring && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              leftIcon={<Server size={16} />}
              onClick={() => {
                const newServer: MCPServerConfig = {
                  id: crypto.randomUUID(),
                  name: "New MCP Server",
                  url: "http://localhost:3000",
                  enabled: false,
                  capabilities: {
                    resources: true,
                    prompts: false,
                    tools: true,
                    sampling: false
                  },
                  status: 'disconnected'
                };
                setServers([...servers, newServer]);
                setActiveServer(newServer);
                setIsEditing(true);
              }}
            >
              Add New Server
            </Button>
          )}
        </div>

        {/* Server details */}
        <div className="md:col-span-2">
          {activeServer ? (
            isEditing ? (
              <ServerEditor 
                server={activeServer} 
                onSave={(_updatedServer) => {
                  setServers(servers.map(_s => _s.id === _updatedServer.id ? _updatedServer : _s));
                  setActiveServer(_updatedServer);
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ServerDetails 
                server={activeServer} 
                onEdit={() => setIsEditing(true)}
                onToggleEnabled={() => toggleServerEnabled(activeServer.id)}
                showControls={isConfiguring}
              />
            )
          ) : (
            <div className="bg-muted/30 rounded-lg h-full flex items-center justify-center p-8 text-center">
              <div>
                <Monitor size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-medium">Select a Server</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  Select a Model Context Protocol server from the list to view its details and capabilities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ServerDetailsProps {
  server: MCPServerConfig;
  onEdit: () => void;
  onToggleEnabled: () => void;
  showControls: boolean;
}

function ServerDetails({ server, onEdit, onToggleEnabled, showControls }: ServerDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-primary" />
            {server.name}
          </div>
          {showControls && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Settings size={16} />}
                onClick={onEdit}
              >
                Edit
              </Button>
              <Button 
                variant={server.enabled ? "success" : "default"} 
                size="sm"
                onClick={onToggleEnabled}
              >
                {server.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Status</h4>
            <Badge 
              variant={server.status === 'connected' ? 'success' : server.status === 'initializing' ? 'secondary' : 'destructive'}
              animation={server.status === 'initializing' ? 'pulse' : 'none'}
              size="sm"
              className="font-normal"
            >
              {server.status === 'connected' ? (
                <Check size={12} className="mr-1" />
              ) : server.status === 'initializing' ? (
                <Loader size={12} className="animate-spin mr-1" />
              ) : (
                <X size={12} className="mr-1" />
              )}
              {server.status === 'connected' ? 'Connected' : server.status === 'initializing' ? 'Connecting...' : 'Disconnected'}
            </Badge>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">URL</h4>
            <div className="text-sm bg-muted/50 p-2 rounded-md">{server.url}</div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={server.capabilities.resources ? 'secondary' : 'outline'}>
                Resources
              </Badge>
              <Badge variant={server.capabilities.prompts ? 'secondary' : 'outline'}>
                Prompts
              </Badge>
              <Badge variant={server.capabilities.tools ? 'secondary' : 'outline'}>
                Tools
              </Badge>
              <Badge variant={server.capabilities.sampling ? 'secondary' : 'outline'}>
                Sampling
              </Badge>
            </div>
          </div>
        </div>
        
        {server.status === 'connected' ? (
          <div className="space-y-3 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">Available Tools</h3>
              <Badge variant="secondary">{server.capabilities.tools ? '3' : '0'}</Badge>
            </div>
            
            {server.capabilities.tools && (
              <div className="space-y-2">
                <MCPToolCard
                  name="Web Search"
                  description="Search the web for information"
                  icon={<Search className="h-4 w-4" />}
                />
                <MCPToolCard
                  name="Code Execution"
                  description="Execute code in a sandbox environment"
                  icon={<FileCode className="h-4 w-4" />}
                />
                <MCPToolCard
                  name="Data Analysis"
                  description="Analyze data and generate charts"
                  icon={<BarChart className="h-4 w-4" />}
                />
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <h3 className="text-md font-medium">Available Resources</h3>
              <Badge variant="secondary">{server.capabilities.resources ? '2' : '0'}</Badge>
            </div>
            
            {server.capabilities.resources && (
              <div className="space-y-2">
                <MCPResourceCard
                  name="Document Store"
                  description="Access to your personal documents"
                  icon={<FileText className="h-4 w-4" />}
                />
                <MCPResourceCard
                  name="Knowledge Base"
                  description="Access to shared knowledge base"
                  icon={<Database className="h-4 w-4" />}
                />
              </div>
            )}
          </div>
        ) : (
          server.status === 'initializing' ? (
            <div className="bg-secondary/10 rounded-lg p-4 mt-4 text-center">
              <Loader className="animate-spin h-6 w-6 mx-auto text-secondary mb-2" />
              <p className="text-sm">Establishing connection to the MCP server...</p>
            </div>
          ) : (
            <div className="bg-destructive/10 rounded-lg p-4 mt-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Server Disconnected</p>
                <p className="text-sm text-destructive/80 mt-1">This MCP server is currently disconnected. Enable the server to establish a connection.</p>
              </div>
            </div>
          )
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <div>Server ID: {server.id}</div>
      </CardFooter>
    </Card>
  );
}

interface ServerEditorProps {
  server: MCPServerConfig;
  onSave: (server: MCPServerConfig) => void;
  onCancel: () => void;
}

function ServerEditor({ server, onSave, onCancel }: ServerEditorProps) {
  const [editedServer, setEditedServer] = useState<MCPServerConfig>({...server});
  
  const handleCapabilityToggle = (_capability: keyof MCPServerConfig['capabilities']) => {
    setEditedServer({
      ...editedServer,
      capabilities: {
        ...editedServer.capabilities,
        [_capability]: !editedServer.capabilities[_capability]
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit MCP Server</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Server Name</label>
            <input
              id="name"
              type="text"
              value={editedServer.name}
              onChange={_e => setEditedServer({...editedServer, name: _e.target.value})}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-1">Server URL</label>
            <input
              id="url"
              type="text"
              value={editedServer.url}
              onChange={_e => setEditedServer({...editedServer, url: _e.target.value})}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Capabilities</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="resources"
                  type="checkbox"
                  checked={editedServer.capabilities.resources}
                  onChange={() => handleCapabilityToggle('resources')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="resources" className="ml-2 block text-sm">Resources</label>
              </div>
              <div className="flex items-center">
                <input
                  id="prompts"
                  type="checkbox"
                  checked={editedServer.capabilities.prompts}
                  onChange={() => handleCapabilityToggle('prompts')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="prompts" className="ml-2 block text-sm">Prompts</label>
              </div>
              <div className="flex items-center">
                <input
                  id="tools"
                  type="checkbox"
                  checked={editedServer.capabilities.tools}
                  onChange={() => handleCapabilityToggle('tools')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="tools" className="ml-2 block text-sm">Tools</label>
              </div>
              <div className="flex items-center">
                <input
                  id="sampling"
                  type="checkbox"
                  checked={editedServer.capabilities.sampling}
                  onChange={() => handleCapabilityToggle('sampling')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="sampling" className="ml-2 block text-sm">Sampling</label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Enable Server</label>
            <div className="flex items-center">
              <input
                id="enabled"
                type="checkbox"
                checked={editedServer.enabled}
                onChange={() => setEditedServer({...editedServer, enabled: !editedServer.enabled})}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm">
                {editedServer.enabled ? 'Enabled' : 'Disabled'}
              </label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          variant="default" 
          onClick={() => onSave(editedServer)}
          disabled={!editedServer.name || !editedServer.url}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

interface MCPToolCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
}

function MCPToolCard({ name, description, icon }: MCPToolCardProps) {
  return (
    <div className="bg-card/50 border border-border rounded-lg p-3 flex items-center shadow-sm">
      <div className="bg-primary/10 p-2 rounded mr-3">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium">{name}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface MCPResourceCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
}

function MCPResourceCard({ name, description, icon }: MCPResourceCardProps) {
  return (
    <div className="bg-card/50 border border-border rounded-lg p-3 flex items-center shadow-sm">
      <div className="bg-secondary/10 p-2 rounded mr-3">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium">{name}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// For the component to work
function Search(_props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {..._props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FileText(_props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {..._props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function Database(_props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {..._props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function BarChart(_props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {..._props}
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

// Sample default servers
const defaultServers: MCPServerConfig[] = [
  {
    id: 'mcp-server-1',
    name: 'Local Development Server',
    url: 'http://localhost:3000/mcp',
    enabled: false,
    capabilities: {
      resources: true,
      prompts: true,
      tools: true,
      sampling: true
    },
    status: 'disconnected'
  },
  {
    id: 'mcp-server-2',
    name: 'Gary8 Tools Server',
    url: 'https://api.gary8.ai/mcp',
    enabled: true,
    capabilities: {
      resources: true,
      prompts: false,
      tools: true,
      sampling: false
    },
    status: 'connected'
  },
  {
    id: 'mcp-server-3',
    name: 'Resources Server',
    url: 'https://resources.gary8.ai/mcp',
    enabled: true,
    capabilities: {
      resources: true,
      prompts: false,
      tools: false,
      sampling: false
    },
    status: 'connected'
  }
];