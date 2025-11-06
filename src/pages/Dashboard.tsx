import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Code2, FileText, Bug, Zap, Shield, TestTube, BookOpen, Sparkles, 
  Search, Grid3X3, List, ChevronRight, Code, MessageSquare, Home, Play, RefreshCw
} from "lucide-react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
interface Tool {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  path: string;
  category: string;
  color: string;
  tags: string[];
  popular?: boolean;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime?: string;
}

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  path: string;
  color: string;
  action?: () => void;
}

// Categories
const categories = [
  { id: 'all', name: 'All Tools', icon: Code },
  { id: 'generation', name: 'Generation', icon: Sparkles },
  { id: 'debug', name: 'Debugging', icon: Bug },
  { id: 'explain', name: 'Explanation', icon: BookOpen },
  { id: 'test', name: 'Testing', icon: TestTube },
  { id: 'optimize', name: 'Optimization', icon: Zap },
  { id: 'security', name: 'Security', icon: Shield }
];

// Tool data
const allTools: Tool[] = [
  { 
    id: 'code-conversion',
    icon: RefreshCw, 
    label: 'Code Conversion', 
    description: 'Convert code between programming languages while maintaining logic and formatting',
    path: '/dashboard/convert',
    category: 'utilities',
    color: 'from-purple-500 to-pink-500',
    tags: ['Multi-language', 'Code Translation'],
    popular: true,
    difficulty: 'Intermediate',
    estimatedTime: '1-3 min'
  },
  { 
    id: 'code-generator',
    icon: Code, 
    label: 'Code Generator', 
    description: 'Turn natural language prompts into production-ready code structures',
    path: '/dashboard/generate',
    category: 'generation',
    color: 'from-blue-500 to-indigo-600',
    tags: ['AI', 'Code Generation'],
    popular: true,
    difficulty: 'Beginner',
    estimatedTime: '2-5 min'
  },
  { 
    id: 'debug-refactor',
    icon: Bug, 
    label: 'Debug & Refactor', 
    description: 'Detect bugs, performance issues, and get suggested fixes',
    path: '/dashboard/debug',
    category: 'debug',
    color: 'from-rose-500 to-pink-600',
    tags: ['Debugging', 'Code Quality', 'Refactoring'],
    difficulty: 'Intermediate',
    estimatedTime: '3-7 min',
    popular: true
  },
  { 
    id: 'code-explainer',
    icon: BookOpen, 
    label: 'Code Explanation', 
    description: 'Get step-by-step explanations for any code snippet',
    path: '/dashboard/explain',
    category: 'explain',
    color: 'from-emerald-500 to-teal-600',
    tags: ['Learning', 'Documentation'],
    difficulty: 'Beginner',
    estimatedTime: '1-3 min'
  },
  { 
    id: 'documentation-generator',
    icon: FileText, 
    label: 'Documentation', 
    description: 'Auto-create structured documentation with parameters and examples',
    path: '/dashboard/docs',
    category: 'generation',
    color: 'from-cyan-500 to-blue-500',
    tags: ['Documentation', 'Code Quality'],
    difficulty: 'Beginner',
    estimatedTime: '2-5 min'
  },
  { 
    id: 'code-optimizer',
    icon: Zap, 
    label: 'Code Optimizer', 
    description: 'Analyze and recommend performance improvements',
    path: '/dashboard/optimize',
    category: 'optimize',
    color: 'from-amber-500 to-orange-500',
    tags: ['Performance', 'Optimization', 'Complexity'],
    difficulty: 'Advanced',
    estimatedTime: '5-10 min',
    popular: true
  },
  { 
    id: 'test-generator',
    icon: TestTube, 
    label: 'Test Generator', 
    description: 'Produce unit, integration, and edge case tests',
    path: '/dashboard/test',
    category: 'test',
    color: 'from-violet-500 to-purple-600',
    tags: ['Testing', 'Quality Assurance', 'TDD'],
    difficulty: 'Intermediate',
    estimatedTime: '3-6 min'
  },
  { 
    id: 'security-audit',
    icon: Shield, 
    label: 'Security Audit', 
    description: 'Scan code for vulnerabilities and get safer alternatives',
    path: '/dashboard/security',
    category: 'security',
    color: 'from-green-500 to-emerald-500',
    tags: ['Security', 'Vulnerabilities', 'Best Practices'],
    difficulty: 'Advanced',
    estimatedTime: '5-15 min',
    popular: true
  },
  { 
    id: 'code-runner',
    icon: Play, 
    label: 'Code Runner', 
    description: 'Execute and test your code in multiple languages',
    path: '/dashboard/runner',
    category: 'utilities',
    color: 'from-blue-500 to-cyan-500',
    tags: ['Execution', 'Testing', 'Debugging'],
    difficulty: 'Beginner',
    popular: true
  },
  { 
    id: 'ai-chat',
    icon: MessageSquare, 
    label: 'AI Chat', 
    description: 'Get help and guidance from AI coding assistant',
    path: '/dashboard/chat',
    category: 'utilities',
    color: 'from-indigo-500 to-purple-500',
    tags: ['AI', 'Assistance', 'Support'],
    difficulty: 'Beginner',
    popular: true
  }
];


// Components
const ToolCard = ({ tool }: { tool: Tool }) => (
  <Link to={tool.path} className="group block h-full">
    <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 overflow-hidden hover:shadow-primary/5 group-hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-r ${tool.color} group-hover:opacity-90 transition-opacity`}>
          <tool.icon className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
          {tool.label}
        </CardTitle>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {tool.description}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5 items-center">
          {tool.tags.slice(0, 2).map((tag, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className="text-xs font-normal px-1.5 py-0 h-5"
            >
              {tag}
            </Badge>
          ))}
          {tool.tags.length > 2 && (
            <Badge variant="outline" className="text-xs font-normal px-1.5 py-0.5">
              +{tool.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
);

const ToolRow = ({ tool }: { tool: Tool }) => (
  <Link to={tool.path} className="block">
    <Card className="transition-all hover:shadow-sm hover:border-primary/50 group hover:shadow-primary/5">
      <div className="flex items-center p-4">
        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center mr-4 bg-gradient-to-r ${tool.color}`}>
          <tool.icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {tool.label}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{tool.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {tool.tags.slice(0, 2).map((tag, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="text-xs font-normal px-1.5 py-0 h-5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  </Link>
);

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get user's display name (username, full name, or email username)
  const displayName = profile?.name || profile?.full_name || user?.email?.split('@')[0] || 'Developer';

  const filteredTools = useMemo(() => {
    return allTools.filter(tool => {
      const matchesSearch = searchQuery === '' || 
        tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);
  
  // Count tools per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTools.length };
    categories.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = allTools.filter(tool => tool.category === cat.id).length;
      }
    });
    return counts;
  }, [allTools]);
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Welcome Section */}
        <section className="mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col space-y-4 sm:space-y-6 md:space-y-0 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Welcome to <span className="text-primary">A&B CodeDev</span>
                </h1>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" title="Online" />
              </div>
              <p className="text-muted-foreground max-w-lg text-xs sm:text-sm">
                What would you like to work on today? Here are your development tools and resources.
              </p>
            </div>
            <div className="w-full xs:w-auto flex-grow max-w-full sm:max-w-md md:max-w-xs lg:max-w-sm xl:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tools..."
                  className="pl-9 sm:pl-10 w-full h-10 sm:h-11 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tools Header */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg xs:text-xl font-semibold tracking-tight">Development Tools</h2>
              <p className="text-xs xs:text-sm text-muted-foreground">
                {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} available
              </p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="hidden xs:inline text-xs sm:text-sm text-muted-foreground">View:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                title="Grid view"
              >
                <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                title="List view"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Tools Grid/List */}
        <section className="mb-10 sm:mb-12 lg:mb-16">
          {filteredTools.length === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <p className="text-muted-foreground text-sm sm:text-base">No tools found. Try adjusting your search or filter.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredTools.map((tool) => (
                <ToolRow key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Code2 className="h-5 w-5 text-primary" />
              <span className="font-medium">CodeDevAI</span>
            </div>
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} CodeDevAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
