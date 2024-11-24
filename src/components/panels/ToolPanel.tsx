import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tool, 
  Wrench, 
  Search, 
  Code, 
  FileText, 
  Database,
  Plus,
  Settings
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ToolItemProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ToolItem = ({ name, description, icon, onClick }: ToolItemProps) => (
  <Card 
    className="p-4 cursor-pointer hover:bg-accent transition-colors"
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-medium">{name}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  </Card>
);

export function ToolPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();

  const tools = {
    development: [
      {
        name: 'Code Analysis',
        description: 'Analyze code structure and quality',
        icon: <Code className="w-5 h-5 text-primary" />,
        action: () => {}
      },
      {
        name: 'Database Explorer',
        description: 'Explore and query databases',
        icon: <Database className="w-5 h-5 text-primary" />,
        action: () => {}
      }
    ],
    search: [
      {
        name: 'Web Search',
        description: 'Search across multiple sources',
        icon: <Search className="w-5 h-5 text-primary" />,
        action: () => {}
      },
      {
        name: 'Document Search',
        description: 'Search project documentation',
        icon: <FileText className="w-5 h-5 text-primary" />,
        action: () => {}
      }
    ],
    utilities: [
      {
        name: 'Custom Tool Builder',
        description: 'Create custom tools',
        icon: <Plus className="w-5 h-5 text-primary" />,
        action: () => {}
      },
      {
        name: 'Tool Settings',
        description: 'Configure tool settings',
        icon: <Settings className="w-5 h-5 text-primary" />,
        action: () => {}
      }
    ]
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tool className="w-6 h-6 text-primary" />
          Tools
        </h2>
        <Button variant="outline" size="icon">
          <Wrench className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          className="pl-9"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="development" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="development">Dev</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="utilities">Utils</TabsTrigger>
        </TabsList>

        {Object.entries(tools).map(([category, categoryTools]) => (
          <TabsContent 
            key={category} 
            value={category}
            className="flex-1 mt-0"
          >
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-2 pr-4">
                {categoryTools
                  .filter(tool => 
                    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(tool => (
                    <ToolItem
                      key={tool.name}
                      name={tool.name}
                      description={tool.description}
                      icon={tool.icon}
                      onClick={tool.action}
                    />
                  ))
                }
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 