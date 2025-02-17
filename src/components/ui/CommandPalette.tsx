import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useHotkeys } from 'react-hotkeys-hook';
import { AgentOrchestrator } from '@/lib/agents/orchestrator';
import { thoughtLogger } from '@/lib/utils/logger';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  category: 'agent' | 'tool' | 'canvas' | 'system';
  action: () => Promise<void>;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const orchestrator = AgentOrchestrator.getInstance();

  useHotkeys('meta+k, ctrl+k', (e) => {
    e.preventDefault();
    setOpen(true);
  });

  useEffect(() => {
    loadCommands();
  }, []);

  async function loadCommands() {
    const agentCommands = await getAgentCommands();
    const toolCommands = await getToolCommands();
    const canvasCommands = getCanvasCommands();
    const systemCommands = getSystemCommands();

    setCommands([
      ...agentCommands,
      ...toolCommands,
      ...canvasCommands,
      ...systemCommands
    ]);
  }

  async function getAgentCommands(): Promise<CommandItem[]> {
    const agents = await orchestrator.getAvailableAgents();
    return agents.map(agent => ({
      id: `agent-${agent.id}`,
      title: `Use ${agent.name}`,
      description: `Execute tasks with ${agent.name}`,
      category: 'agent',
      action: async () => {
        try {
          await orchestrator.executeAgent(agent.id);
          thoughtLogger.info(`Executed agent: ${agent.name}`);
        } catch (error) {
          thoughtLogger.error(`Failed to execute agent: ${agent.name}`, { error });
        }
      }
    }));
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 w-[640px] max-w-[90vw] max-h-[80vh] bg-background rounded-lg shadow-lg"
    >
      <div className="flex items-center border-b px-3">
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command or search..."
          className="w-full py-3 outline-none bg-transparent"
        />
      </div>

      <Command.List className="max-h-[300px] overflow-y-auto p-2">
        <Command.Empty>No results found.</Command.Empty>

        {['agent', 'tool', 'canvas', 'system'].map(category => (
          <Command.Group key={category} heading={category.toUpperCase()}>
            {commands
              .filter(cmd => cmd.category === category)
              .map(command => (
                <Command.Item
                  key={command.id}
                  onSelect={() => command.action()}
                  className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer
                           hover:bg-accent hover:text-accent-foreground"
                >
                  {command.icon}
                  <div>
                    <div className="font-medium">{command.title}</div>
                    {command.description && (
                      <div className="text-sm text-muted-foreground">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {command.shortcut && (
                    <div className="ml-auto text-sm text-muted-foreground">
                      {command.shortcut}
                    </div>
                  )}
                </Command.Item>
              ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
} 
