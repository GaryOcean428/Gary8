 
import React, { useState, useEffect } from 'react';
import { Wrench, Search, Filter, ArrowUpDown, Plus, Trash2, ChevronRight, ChevronDown, FileCode, PenTool, BarChart4, Database, Network, Loader } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../shared/hooks/useToast';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  code: string;
  language: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsed?: number;
  isBuiltIn?: boolean;
  version: string;
  status: 'approved' | 'pending' | 'rejected' | 'draft';
}

export type ToolCategory = 
  | 'data-processing'
  | 'web-scraping'
  | 'code-generation'
  | 'visualization'
  | 'utility'
  | 'database'
  | 'ai-integration';

export function ToolManager() {
  const [tools, setTools] = useLocalStorage<Tool[]>('gary8_tools', defaultTools);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(tools);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ToolCategory[]>([]);
  const [sortOption, setSortOption] = useState<'recent' | 'name' | 'usage'>('recent');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'data-processing': true,
    'web-scraping': true,
    'code-generation': true,
    'visualization': true,
    'utility': true,
    'database': true,
    'ai-integration': true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  // Filter and sort tools whenever tools, search query, or filters change
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate delay for loading effect
    setTimeout(() => {
      let filtered = [...tools];
      
      // Apply category filter if any categories selected
      if (selectedCategories.length > 0) {
        filtered = filtered.filter(tool => selectedCategories.includes(tool.category));
      }
      
      // Apply search filter
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(tool => 
          tool.name.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Apply sort
      switch (sortOption) {
        case 'recent':
          filtered.sort((a, b) => b.updatedAt - a.updatedAt);
          break;
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'usage':
          filtered.sort((a, b) => b.usageCount - a.usageCount);
          break;
      }
      
      setFilteredTools(filtered);
      setIsLoading(false);
    }, 300);
  }, [tools, searchQuery, selectedCategories, sortOption]);

  const handleCategoryToggle = (category: ToolCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleToggleCategory = (category: string) => {
    setOpenCategories({
      ...openCategories,
      [category]: !openCategories[category]
    });
  };

  const groupToolsByCategory = () => {
    const grouped: Record<string, Tool[]> = {};
    
    filteredTools.forEach(tool => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });
    
    return grouped;
  };

  const categoryDisplayNames: Record<ToolCategory, string> = {
    'data-processing': 'Data Processing',
    'web-scraping': 'Web Scraping',
    'code-generation': 'Code Generation',
    'visualization': 'Visualization',
    'utility': 'Utility',
    'database': 'Database',
    'ai-integration': 'AI Integration'
  };

  const categoryIcons: Record<ToolCategory, React.ReactNode> = {
    'data-processing': <Database className="h-4 w-4" />,
    'web-scraping': <Network className="h-4 w-4" />,
    'code-generation': <FileCode className="h-4 w-4" />,
    'visualization': <BarChart4 className="h-4 w-4" />,
    'utility': <Wrench className="h-4 w-4" />,
    'database': <Database className="h-4 w-4" />,
    'ai-integration': <PenTool className="h-4 w-4" />
  };

  const getCategoryIcon = (category: ToolCategory) => {
    return categoryIcons[category] || <Wrench className="h-4 w-4" />;
  };

  const deleteTool = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      const updatedTools = tools.filter(tool => tool.id !== id);
      setTools(updatedTools);
      
      if (selectedTool?.id === id) {
        setSelectedTool(null);
      }
      
      addToast({
        type: 'success',
        message: 'Tool deleted successfully',
        duration: 3000
      });
    }
  };

  const renderToolList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      );
    }
    
    if (filteredTools.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No tools found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      );
    }
    
    const groupedTools = groupToolsByCategory();
    const categories = Object.keys(groupedTools).sort() as ToolCategory[];
    
    return (
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="border border-border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer"
              onClick={() => handleToggleCategory(category)}
            >
              <div className="flex items-center space-x-2">
                {getCategoryIcon(category as ToolCategory)}
                <span className="font-medium">{categoryDisplayNames[category as ToolCategory]}</span>
                <Badge variant="outline">{groupedTools[category].length}</Badge>
              </div>
              {openCategories[category] ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            {openCategories[category] && (
              <div className="divide-y divide-border">
                {groupedTools[category].map((tool) => (
                  <div 
                    key={tool.id} 
                    className={`p-3 hover:bg-muted/30 cursor-pointer transition-colors ${
                      selectedTool?.id === tool.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedTool(tool)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {tool.name}
                          {tool.isBuiltIn && (
                            <Badge variant="secondary" className="ml-2 text-xs">Built-in</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="text-xs">v{tool.version}</Badge>
                        {!tool.isBuiltIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTool(tool.id);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full">
      {/* Tool list sidebar */}
      <div className="lg:w-1/2 xl:w-2/5 h-full flex flex-col">
        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-4 flex flex-col h-full">
          {/* Heading */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Tools</h2>
            <Button 
              variant="default" 
              size="sm"
              leftIcon={<Plus size={16} />}
            >
              Create New Tool
            </Button>
          </div>
          
          {/* Search and filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 py-2 bg-muted/20 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-1 bg-muted/20 border border-border rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  leftIcon={<Filter size={12} />}
                >
                  Filter
                </Button>
                
                <div className="h-5 border-l border-border"></div>
                
                <div className="flex flex-wrap gap-1 px-1">
                  {(['data-processing', 'web-scraping', 'code-generation', 'visualization', 'utility', 'database', 'ai-integration'] as ToolCategory[])
                    .map((category) => (
                      <button
                        key={category}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedCategories.includes(category)
                            ? 'bg-primary text-white'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                        onClick={() => handleCategoryToggle(category)}
                      >
                        {getCategoryIcon(category)}
                        <span className="ml-1">{categoryDisplayNames[category]}</span>
                      </button>
                    ))
                  }
                </div>
              </div>
              
              <div className="flex items-center space-x-1 bg-muted/20 border border-border rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  leftIcon={<ArrowUpDown size={12} />}
                >
                  Sort
                </Button>
                
                <div className="h-5 border-l border-border"></div>
                
                <div className="flex flex-wrap gap-1 px-1">
                  <button
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      sortOption === 'recent'
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={() => setSortOption('recent')}
                  >
                    Recent
                  </button>
                  <button
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      sortOption === 'name'
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={() => setSortOption('name')}
                  >
                    Name
                  </button>
                  <button
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      sortOption === 'usage'
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={() => setSortOption('usage')}
                  >
                    Most Used
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tool list */}
          <div className="flex-1 overflow-auto">
            {renderToolList()}
          </div>
        </div>
      </div>
      
      {/* Tool details */}
      <div className="lg:w-1/2 xl:w-3/5 h-full">
        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-4 h-full">
          {selectedTool ? (
            <ToolDetail tool={selectedTool} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Wrench className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a Tool</h3>
              <p className="text-muted-foreground max-w-md">
                Choose a tool from the list to view its details and code. Or create a new tool to add to your collection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ToolDetailProps {
  tool: Tool;
}

function ToolDetail({ tool }: ToolDetailProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'code' | 'usage'>('about');
  
  return (
    <div className="h-full flex flex-col">
      {/* Tool header */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{tool.name}</h2>
          <div className="flex space-x-2">
            <Badge variant={tool.status === 'approved' ? 'success' : tool.status === 'pending' ? 'warning' : tool.status === 'rejected' ? 'destructive' : 'secondary'}>
              {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
            </Badge>
            <Badge variant="outline">v{tool.version}</Badge>
          </div>
        </div>
        <p className="text-muted-foreground mt-1">{tool.description}</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border mb-4">
        <div className="flex space-x-4">
          <button
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === 'about'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === 'code'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === 'usage'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('usage')}
          >
            Usage
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Category</h3>
              <Badge variant="secondary">{categoryDisplayNames[tool.category]}</Badge>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Author</h3>
              <p className="text-sm">{tool.author}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Created</h3>
              <p className="text-sm">{new Date(tool.createdAt).toLocaleString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Last Updated</h3>
              <p className="text-sm">{new Date(tool.updatedAt).toLocaleString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Usage Count</h3>
              <p className="text-sm">{tool.usageCount} times</p>
            </div>
            
            {tool.lastUsed && (
              <div>
                <h3 className="text-sm font-medium mb-1">Last Used</h3>
                <p className="text-sm">{new Date(tool.lastUsed).toLocaleString()}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-1">Built-in Tool</h3>
              <Badge variant={tool.isBuiltIn ? "secondary" : "outline"}>
                {tool.isBuiltIn ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        )}
        
        {activeTab === 'code' && (
          <div className="font-mono text-sm whitespace-pre-wrap overflow-auto rounded-md bg-muted/50 p-4 h-full">
            <pre>{tool.code}</pre>
          </div>
        )}
        
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Usage Instructions</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm mb-2">To use this tool in your chat:</p>
                  <div className="bg-muted p-2 rounded-md">
                    <code className="text-xs">@tool {tool.name} [parameters]</code>
                  </div>
                  <p className="text-sm mt-4 mb-2">Example:</p>
                  <div className="bg-muted p-2 rounded-md">
                    <code className="text-xs">
                      @tool {tool.name}{' '}
                      {tool.name === 'Web Scraper'
                        ? 'url="https://example.com" selector=".main-content"' // simplified quotes
                        : tool.name === 'Data Formatter'
                        ? `data='{"name":"Test"}' fromFormat="json" toFormat="csv"`
                        : 'parameter1="value1" parameter2="value2"'}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Performance Metrics</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Average Execution Time</p>
                      <p className="text-lg font-medium">120ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-lg font-medium">98.2%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Used By</p>
                      <p className="text-lg font-medium">5 Agents</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Memory Usage</p>
                      <p className="text-lg font-medium">4.3 MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Recent Uses</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="text-sm p-2 border-b border-border last:border-0">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{new Date(Date.now() - 1000 * 60 * 60 * (i + 2)).toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">Success</Badge>
                        </div>
                        <p className="mt-1">
                          {i === 0 ? `Processed data with parameters: limit=50, format="json"` : 
                           i === 1 ? `Analyzed text with options: language="en", sentiment=true` :
                           `Generated report with type="summary", length="short"`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Categories display names
const categoryDisplayNames: Record<ToolCategory, string> = {
  'data-processing': 'Data Processing',
  'web-scraping': 'Web Scraping',
  'code-generation': 'Code Generation',
  'visualization': 'Visualization',
  'utility': 'Utility',
  'database': 'Database',
  'ai-integration': 'AI Integration'
};

// Sample tools
const defaultTools: Tool[] = [
  {
    id: 't1',
    name: 'Web Scraper',
    description: 'Extract data from web pages with CSS selectors',
    category: 'web-scraping',
    code: `async function scrapeWebPage(url, selector) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.querySelectorAll(selector);
    return Array.from(elements).map(el => el.textContent);
  } catch (error) {
    throw new Error(\`Failed to scrape \${url}: \${error.message}\`);
  }
}`,
    language: 'javascript',
    author: 'Gary8 System',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
    usageCount: 127,
    lastUsed: Date.now() - 1000 * 60 * 60, // 1 hour ago
    isBuiltIn: true,
    version: '1.2.0',
    status: 'approved'
  },
  {
    id: 't2',
    name: 'Data Formatter',
    description: 'Format and validate data in various formats (JSON, CSV, XML)',
    category: 'data-processing',
    code: `function formatData(data, fromFormat, toFormat) {
  if (!data || !fromFormat || !toFormat) {
    throw new Error('Missing required parameters');
  }

  // Convert input to JSON object first
  let jsonData;
  try {
    if (fromFormat === 'json') {
      jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    } else if (fromFormat === 'csv') {
      jsonData = csvToJson(data);
    } else if (fromFormat === 'xml') {
      jsonData = xmlToJson(data);
    } else {
      throw new Error(\`Unsupported input format: \${fromFormat}\`);
    }
  } catch (error) {
    throw new Error(\`Failed to parse \${fromFormat} data: \${error.message}\`);
  }

  // Convert JSON to target format
  try {
    if (toFormat === 'json') {
      return JSON.stringify(jsonData, null, 2);
    } else if (toFormat === 'csv') {
      return jsonToCsv(jsonData);
    } else if (toFormat === 'xml') {
      return jsonToXml(jsonData);
    } else {
      throw new Error(\`Unsupported output format: \${toFormat}\`);
    }
  } catch (error) {
    throw new Error(\`Failed to convert to \${toFormat}: \${error.message}\`);
  }
}`,
    language: 'javascript',
    author: 'Gary8 System',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    usageCount: 84,
    lastUsed: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    isBuiltIn: true,
    version: '1.0.1',
    status: 'approved'
  },
  {
    id: 't3',
    name: 'Chart Generator',
    description: 'Generate charts and visualizations from data',
    category: 'visualization',
    code: `function generateChart(data, type, options = {}) {
  // Validate inputs
  if (!data || !type) {
    throw new Error('Data and chart type are required');
  }
  
  // Configure chart
  const config = {
    type: type, // bar, line, pie, etc.
    data: {
      labels: data.labels || [],
      datasets: [{
        label: options.label || 'Dataset',
        data: data.values || [],
        backgroundColor: options.colors || [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: options.borderColors || [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: options.borderWidth || 1
      }]
    },
    options: {
      responsive: true,
      title: {
        display: !!options.title,
        text: options.title || ''
      },
      // ... other chart.js options
    }
  };
  
  // Return configuration for rendering
  return config;
}`,
    language: 'javascript',
    author: 'Gary8 System',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45, // 45 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
    usageCount: 156,
    lastUsed: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    isBuiltIn: true,
    version: '2.1.0',
    status: 'approved'
  },
  {
    id: 't4',
    name: 'SQL Query Builder',
    description: 'Build and validate SQL queries',
    category: 'database',
    code: `class SQLQueryBuilder {
  constructor() {
    this.query = {
      type: null,
      table: null,
      columns: [],
      where: [],
      orderBy: null,
      limit: null,
      join: []
    };
  }

  select(...columns) {
    this.query.type = 'SELECT';
    this.query.columns = columns.length ? columns : ['*'];
    return this;
  }

  from(table) {
    this.query.table = table;
    return this;
  }

  where(condition) {
    this.query.where.push(condition);
    return this;
  }

  orderBy(column, direction = 'ASC') {
    this.query.orderBy = { column, direction };
    return this;
  }

  limit(limit) {
    this.query.limit = limit;
    return this;
  }

  join(table, on, type = 'INNER') {
    this.query.join.push({ table, on, type });
    return this;
  }

  build() {
    if (!this.query.type) throw new Error('Query type not specified');
    if (!this.query.table) throw new Error('Table not specified');

    let sql = \`\${this.query.type} \${this.query.columns.join(', ')} FROM \${this.query.table}\`;

    // Add joins
    if (this.query.join.length) {
      sql += this.query.join.map(j => \` \${j.type} JOIN \${j.table} ON \${j.on}\`).join('');
    }

    // Add where clauses
    if (this.query.where.length) {
      sql += \` WHERE \${this.query.where.join(' AND ')}\`;
    }

    // Add order by
    if (this.query.orderBy) {
      sql += \` ORDER BY \${this.query.orderBy.column} \${this.query.orderBy.direction}\`;
    }

    // Add limit
    if (this.query.limit !== null) {
      sql += \` LIMIT \${this.query.limit}\`;
    }

    return sql;
  }
}`,
    language: 'javascript',
    author: 'Gary8 System',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60, // 60 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    usageCount: 73,
    lastUsed: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    isBuiltIn: true,
    version: '1.3.2',
    status: 'approved'
  },
  {
    id: 't5',
    name: 'Custom Regex Tool',
    description: 'Build and test regular expressions with explanations',
    category: 'utility',
    code: `function analyzeRegex(pattern, flags = 'g', testString = '') {
  try {
    const regex = new RegExp(pattern, flags);
    
    // Get explanation
    const explanation = explainRegex(pattern);
    
    // Test against sample string if provided
    let matches = [];
    if (testString) {
      matches = [...testString.matchAll(regex)];
    }
    
    return {
      isValid: true,
      pattern,
      flags,
      explanation,
      matches: matches.map(match => ({
        fullMatch: match[0],
        groups: match.slice(1),
        index: match.index
      }))
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      pattern,
      flags
    };
  }
}

// Helper function to explain regex components
function explainRegex(pattern) {
  // This is a simplified explanation engine
  // In a real tool, this would be much more comprehensive
  
  const explanations = [];
  
  // Check for common patterns
  if (pattern.includes('^')) explanations.push('^ matches the start of the string');
  if (pattern.includes('$')) explanations.push('$ matches the end of the string');
  if (pattern.includes('.')) explanations.push('. matches any character except newline');
  if (pattern.includes('\\d')) explanations.push('\\d matches any digit (0-9)');
  if (pattern.includes('\\w')) explanations.push('\\w matches any word character (a-z, A-Z, 0-9, _)');
  if (pattern.includes('\\s')) explanations.push('\\s matches any whitespace character');
  
  // Check for quantifiers
  if (pattern.includes('*')) explanations.push('* matches 0 or more of the preceding token');
  if (pattern.includes('+')) explanations.push('+ matches 1 or more of the preceding token');
  if (pattern.includes('?')) explanations.push('? matches 0 or 1 of the preceding token');
  
  // Check for groups
  const groups = pattern.match(/\\([^)]+\\)/g);
  if (groups) {
    explanations.push(\`Contains \${groups.length} capture group(s)\`);
  }
  
  return explanations.join('\\n');
}`,
    language: 'javascript',
    author: 'User',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    usageCount: 12,
    lastUsed: Date.now() - 1000 * 60 * 120, // 2 hours ago
    isBuiltIn: false,
    version: '1.0.0',
    status: 'approved'
  },
  {
    id: 't6',
    name: 'Text Analyzer',
    description: 'Analyze text for readability, sentiment and statistics',
    category: 'data-processing',
    code: `function analyzeText(text) {
  if (!text) {
    return {
      error: 'No text provided for analysis'
    };
  }
  
  // Basic statistics
  const charCount = text.length;
  const wordCount = text.split(/\\s+/).filter(Boolean).length;
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  const paragraphCount = text.split(/\\n\\s*\\n/).filter(Boolean).length;
  
  // Average word length
  const words = text.split(/\\s+/).filter(Boolean);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  
  // Reading time (average 200 words per minute)
  const readingTimeMinutes = wordCount / 200;
  
  // Readability score (simplified Flesch-Kincaid)
  const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
  const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength / 5);
  
  // Sentiment analysis (very basic)
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'happy'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'dislike', 'sad', 'angry'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (positiveWords.includes(lowerWord)) positiveCount++;
    if (negativeWords.includes(lowerWord)) negativeCount++;
  });
  
  const sentimentScore = (positiveCount - negativeCount) / wordCount;
  let sentimentLabel;
  
  if (sentimentScore > 0.05) sentimentLabel = 'Positive';
  else if (sentimentScore < -0.05) sentimentLabel = 'Negative';
  else sentimentLabel = 'Neutral';
  
  // Get top 5 most frequent words
  const wordFrequency = {};
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord && cleanWord.length > 3) { // Skip short words and empty strings
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
    }
  });
  
  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
  
  return {
    basicStats: {
      characters: charCount,
      words: wordCount,
      sentences: sentenceCount,
      paragraphs: paragraphCount,
      avgWordLength: avgWordLength.toFixed(2),
      readingTimeMinutes: readingTimeMinutes.toFixed(2)
    },
    readability: {
      score: readabilityScore.toFixed(2),
      level: getReadabilityLevel(readabilityScore)
    },
    sentiment: {
      score: sentimentScore.toFixed(2),
      label: sentimentLabel,
      positiveWords: positiveCount,
      negativeWords: negativeCount
    },
    topWords
  };
}

function getReadabilityLevel(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}`,
    language: 'javascript',
    author: 'User',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    usageCount: 7,
    lastUsed: Date.now() - 1000 * 60 * 180, // 3 hours ago
    isBuiltIn: false,
    version: '1.0.0',
    status: 'approved'
  },
  {
    id: 't7',
    name: 'AI Prompt Generator',
    description: 'Generate optimized prompts for different AI models',
    category: 'ai-integration',
    code: `function generatePrompt(type, parameters) {
  if (!type) {
    throw new Error('Prompt type is required');
  }

  const templates = {
    'creative': 'Create a {{format}} about {{subject}} that emphasizes {{emphasis}} and evokes a feeling of {{emotion}}.',
    'technical': 'Explain {{concept}} in {{detail}} detail, focusing on {{aspect}}. Include {{examples}} examples and relate it to {{field}}.',
    'analysis': 'Analyze the following {{content}} focusing on {{aspects}}. Consider {{perspective}} and provide {{insightCount}} key insights.',
    'comparison': 'Compare {{itemA}} and {{itemB}} based on {{criteria}}. Highlight {{differentiators}} and conclude which is better for {{scenario}}.',
    'howto': 'Provide step-by-step instructions for {{task}}. Include {{prerequisiteCount}} prerequisites and {{tipCount}} tips for success.'
  };

  if (!templates[type]) {
    throw new Error(\`Unknown prompt type: \${type}\`);
  }

  let prompt = templates[type];

  // Replace placeholders with parameters
  for (const key in parameters) {
    const placeholder = new RegExp(\`{{\${key}}}\`, 'g');
    prompt = prompt.replace(placeholder, parameters[key]);
  }

  // Check for any remaining placeholders
  const remainingPlaceholders = prompt.match(/{{[^}]+}}/g);
  if (remainingPlaceholders) {
    throw new Error(\`Missing parameters: \${remainingPlaceholders.join(', ')}\`);
  }

  return prompt;
}`,
    language: 'javascript',
    author: 'Gary8 System',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    usageCount: 34,
    lastUsed: Date.now() - 1000 * 60 * 45, // 45 minutes ago
    isBuiltIn: true,
    version: '1.1.0',
    status: 'approved'
  }
];