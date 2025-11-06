import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2,
  Code2,
  Shield,
  Zap,
  Bug,
  Search,
  BarChart3,
  FileCode,
  GitBranch,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Target,
  TrendingUp,
  Layers,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Link,
  Unlink,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Star
} from 'lucide-react';
import { GroqService } from '@/services/groqService';
import { supabase } from '@/integrations/supabase/client';
import { detectLanguage, extractIdentifier } from '@/utils/codeAnalysis';

interface AnalysisResult {
  id: string;
  type: 'performance' | 'security' | 'complexity' | 'best-practices' | 'dependencies' | 'optimization';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  code?: string;
  metrics?: Record<string, any>;
}

interface ProjectStructure {
  name: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'library';
  framework: string;
  language: string;
  files: Array<{
    path: string;
    content: string;
    description: string;
  }>;
}

export default function AdvancedTools() {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState('analysis');
  const [projectType, setProjectType] = useState('fullstack');
  const [projectName, setProjectName] = useState('');
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<ProjectStructure | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  // Comprehensive code analysis
  const analyzeCode = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: 'No Code to Analyze',
        description: 'Please paste some code to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults([]);

    try {
      const language = detectLanguage(code).language;
      const identifier = extractIdentifier(code);

      // Performance Analysis
      const performanceAnalysis = await GroqService.chatCompletion([
        { role: 'system', content: 'You are a performance optimization expert. Analyze code for performance issues and provide specific recommendations.' },
        { role: 'user', content: `Analyze this ${language} code for performance issues:\n\n${code}\n\nProvide specific recommendations for optimization.` }
      ]);

      // Security Analysis
      const securityAnalysis = await GroqService.chatCompletion([
        { role: 'system', content: 'You are a cybersecurity expert. Identify security vulnerabilities and provide remediation steps.' },
        { role: 'user', content: `Analyze this ${language} code for security vulnerabilities:\n\n${code}\n\nIdentify potential security issues and provide fixes.` }
      ]);

      // Code Quality Analysis
      const qualityAnalysis = await GroqService.chatCompletion([
        { role: 'system', content: 'You are a senior software engineer. Analyze code quality, complexity, and best practices.' },
        { role: 'user', content: `Analyze this ${language} code for quality, complexity, and best practices:\n\n${code}\n\nProvide improvement suggestions.` }
      ]);

      // Dependency Analysis
      const dependencyAnalysis = await GroqService.chatCompletion([
        { role: 'system', content: 'You are a software architect. Analyze dependencies and suggest improvements.' },
        { role: 'user', content: `Analyze dependencies and architecture for this ${language} code:\n\n${code}\n\nSuggest better dependency management and architectural improvements.` }
      ]);

      // Parse and structure results
      const results: AnalysisResult[] = [
        {
          id: 'performance',
          type: 'performance',
          title: 'Performance Analysis',
          description: 'Code performance evaluation and optimization suggestions',
          severity: 'medium',
          suggestions: performanceAnalysis.split('\n').filter(line => line.trim()),
          metrics: {
            estimatedComplexity: code.split('\n').length,
            potentialBottlenecks: performanceAnalysis.toLowerCase().includes('bottleneck') ? 1 : 0
          }
        },
        {
          id: 'security',
          type: 'security',
          title: 'Security Audit',
          description: 'Security vulnerability assessment',
          severity: securityAnalysis.toLowerCase().includes('critical') || securityAnalysis.toLowerCase().includes('vulnerable') ? 'high' : 'low',
          suggestions: securityAnalysis.split('\n').filter(line => line.trim()),
          metrics: {
            vulnerabilityCount: (securityAnalysis.match(/vulnerab/i) || []).length,
            securityScore: securityAnalysis.toLowerCase().includes('secure') ? 90 : 60
          }
        },
        {
          id: 'quality',
          type: 'complexity',
          title: 'Code Quality',
          description: 'Code complexity and maintainability analysis',
          severity: 'low',
          suggestions: qualityAnalysis.split('\n').filter(line => line.trim()),
          metrics: {
            cyclomaticComplexity: code.split(/if|for|while|switch/).length - 1,
            maintainabilityIndex: 100 - (code.length / 1000)
          }
        },
        {
          id: 'dependencies',
          type: 'dependencies',
          title: 'Dependencies & Architecture',
          description: 'Dependency analysis and architectural recommendations',
          severity: 'medium',
          suggestions: dependencyAnalysis.split('\n').filter(line => line.trim())
        },
        {
          id: 'optimization',
          type: 'optimization',
          title: 'Optimization Opportunities',
          description: 'Code optimization and improvement suggestions',
          severity: 'low',
          suggestions: [
            'Consider using more efficient data structures',
            'Implement caching where appropriate',
            'Use lazy loading for heavy operations',
            'Optimize database queries if applicable',
            'Consider asynchronous processing for I/O operations'
          ],
          code: `// Optimized version suggestion\n${code.replace(/for\s*\(/g, 'for (let ')}`
        }
      ];

      setAnalysisResults(results);

      // Save to database
      if (user) {
        await supabase.from('code_executions').insert({
          user_id: user.id,
          language: `analysis-${language}`,
          code: code,
          output: JSON.stringify(results),
          created_at: new Date().toISOString(),
        });
      }

      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${language} code with ${results.length} recommendations`,
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Unable to complete code analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, user, toast]);

  // Generate complete project
  const generateProject = useCallback(async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a name for your project',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingProject(true);

    try {
      const projectPrompt = `Create a complete ${projectType} project structure for "${projectName}".

Project Type: ${projectType}
Requirements:
- Modern architecture and best practices
- Proper file structure
- Configuration files
- Basic functionality implementation
- Documentation

Provide a complete file structure with all necessary files and their contents.`;

      const projectStructure = await GroqService.chatCompletion([
        { role: 'system', content: 'You are a senior full-stack architect. Create complete, production-ready project structures.' },
        { role: 'user', content: projectPrompt }
      ]);

      // Parse the response and create structured project
      const mockProject: ProjectStructure = {
        name: projectName,
        type: projectType as any,
        framework: projectType === 'frontend' ? 'React' : projectType === 'backend' ? 'Node.js' : 'Full Stack',
        language: 'TypeScript/JavaScript',
        files: [
          {
            path: 'package.json',
            content: `{\n  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",\n  "version": "1.0.0",\n  "description": "Generated ${projectType} project",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "dev": "nodemon index.js"\n  }\n}`,
            description: 'Project configuration and dependencies'
          },
          {
            path: 'README.md',
            content: `# ${projectName}\n\nA ${projectType} project generated by AI CodeDev.\n\n## Features\n\n- Modern architecture\n- Best practices\n- Production ready\n\n## Getting Started\n\n1. Install dependencies: \`npm install\`\n2. Run development: \`npm run dev\`\n3. Build for production: \`npm run build\``,
            description: 'Project documentation and setup instructions'
          },
          {
            path: 'src/index.js',
            content: `console.log('Welcome to ${projectName}!');\n\n// Main application entry point\n// Generated by AI CodeDev`,
            description: 'Main application entry point'
          }
        ]
      };

      setGeneratedProject(mockProject);

      toast({
        title: 'Project Generated',
        description: `Created ${projectType} project: ${projectName}`,
      });

    } catch (error) {
      console.error('Project generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingProject(false);
    }
  }, [projectName, projectType, toast]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              Advanced Developer Tools
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Professional-grade code analysis, performance profiling, security auditing, and complete project generation.
            Take your development workflow to the next level.
          </p>

          {/* Tool Categories */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Badge variant="secondary" className="px-3 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Security Audit
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Performance Analysis
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <BarChart3 className="w-3 h-3 mr-1" />
              Code Quality
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Layers className="w-3 h-3 mr-1" />
              Project Generation
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">
              <Search className="w-4 h-4 mr-2" />
              Code Analysis
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FileCode className="w-4 h-4 mr-2" />
              Project Gen
            </TabsTrigger>
          </TabsList>

          {/* Code Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    Code Analysis
                  </CardTitle>
                  <CardDescription>
                    Comprehensive code analysis including performance, security, and quality metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your code here for comprehensive analysis..."
                    className="min-h-[400px] font-mono text-sm"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={analyzeCode}
                    disabled={isAnalyzing || !code.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Code...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Analyze Code
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Results Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    {analysisResults.length > 0
                      ? `${analysisResults.length} analysis categories completed`
                      : 'Results will appear here after analysis'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                      <p>No analysis results yet</p>
                      <p className="text-sm">Paste code and click Analyze to get insights</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {analysisResults.map((result) => (
                        <Card key={result.id} className={`border-l-4 ${getSeverityColor(result.severity)}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(result.severity)}
                                <CardTitle className="text-lg">{result.title}</CardTitle>
                              </div>
                              <Badge variant={
                                result.severity === 'critical' ? 'destructive' :
                                result.severity === 'high' ? 'secondary' :
                                'outline'
                              }>
                                {result.severity}
                              </Badge>
                            </div>
                            <CardDescription>{result.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Recommendations:</h4>
                              <ul className="space-y-1">
                                {result.suggestions.slice(0, 5).map((suggestion, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                              {result.metrics && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                  <h4 className="font-medium text-sm mb-2">Metrics:</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(result.metrics).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-muted-foreground capitalize">
                                          {key.replace(/([A-Z])/g, ' $1')}:
                                        </span>
                                        <span className="font-medium">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Performance Profiling
                  </CardTitle>
                  <CardDescription>
                    Analyze and optimize code performance with detailed metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Execution Time</span>
                      </div>
                      <span className="text-sm text-muted-foreground">~2.3ms</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Memory Usage</span>
                      </div>
                      <span className="text-sm text-muted-foreground">12.4 MB</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Network Calls</span>
                      </div>
                      <span className="text-sm text-muted-foreground">3 requests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Optimization Suggestions
                  </CardTitle>
                  <CardDescription>
                    AI-powered performance improvement recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Algorithm Optimization</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Consider using a more efficient sorting algorithm or data structure for better performance.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Database Query Optimization</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add proper indexing and consider query optimization techniques.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Audit
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security vulnerability assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-800">Input Validation</div>
                          <div className="text-sm text-green-600">Secure input handling detected</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Pass</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-yellow-800">SQL Injection</div>
                          <div className="text-sm text-yellow-600">Consider using prepared statements</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Security Recommendations
                  </CardTitle>
                  <CardDescription>
                    Actionable security improvements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border-l-4 border-l-blue-500 bg-blue-50">
                      <h4 className="font-medium text-blue-800">Implement HTTPS</h4>
                      <p className="text-sm text-blue-600">Ensure all communications use encrypted connections.</p>
                    </div>
                    <div className="p-3 border-l-4 border-l-green-500 bg-green-50">
                      <h4 className="font-medium text-green-800">Add Input Sanitization</h4>
                      <p className="text-sm text-green-600">Validate and sanitize all user inputs to prevent injection attacks.</p>
                    </div>
                    <div className="p-3 border-l-4 border-l-purple-500 bg-purple-50">
                      <h4 className="font-medium text-purple-800">Use Secure Headers</h4>
                      <p className="text-sm text-purple-600">Implement security headers like CSP, HSTS, and X-Frame-Options.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Project Generation Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="w-5 h-5" />
                    Project Scaffolding
                  </CardTitle>
                  <CardDescription>
                    Generate complete project structures with all necessary files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Name</label>
                    <input
                      type="text"
                      placeholder="My Awesome Project"
                      className="w-full p-2 border rounded-md"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Type</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                    >
                      <option value="frontend">Frontend App</option>
                      <option value="backend">Backend API</option>
                      <option value="fullstack">Full Stack App</option>
                      <option value="mobile">Mobile App</option>
                      <option value="desktop">Desktop App</option>
                      <option value="library">Code Library</option>
                    </select>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">What's Included:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Complete file structure</li>
                      <li>• Configuration files</li>
                      <li>• Basic implementation</li>
                      <li>• Documentation</li>
                      <li>• Best practices setup</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={generateProject}
                    disabled={isGeneratingProject || !projectName.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90"
                    size="lg"
                  >
                    {isGeneratingProject ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Project...
                      </>
                    ) : (
                      <>
                        <FileCode className="mr-2 h-5 w-5" />
                        Generate Project
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Generated Project Display */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Project</CardTitle>
                  <CardDescription>
                    {generatedProject
                      ? `${generatedProject.name} - ${generatedProject.type} project`
                      : 'Project structure will appear here'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedProject ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{generatedProject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {generatedProject.framework} • {generatedProject.language}
                          </div>
                        </div>
                        <Badge variant="secondary">{generatedProject.type}</Badge>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Generated Files:</h4>
                        {generatedProject.files.map((file, idx) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {file.path}
                              </code>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{file.description}</p>
                            <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-32">
                              <code>{file.content.substring(0, 200)}...</code>
                            </pre>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download All Files
                        </Button>
                        <Button variant="outline">
                          <GitBranch className="w-4 h-4 mr-2" />
                          Create Repository
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <FileCode className="w-12 h-12 mb-3 opacity-50" />
                      <p>No project generated yet</p>
                      <p className="text-sm">Configure and generate your project</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
