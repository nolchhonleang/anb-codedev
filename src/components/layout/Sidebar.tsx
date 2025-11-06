import { Code2, FileText, Bug, Zap, Shield, TestTube, BookOpen, Sparkles, Play, MessageSquare, Home, Star, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const navigationSections = [
  {
    title: "Main",
    tools: [
      { 
        icon: Home, 
        label: "Dashboard", 
        description: "Overview and quick access",
        path: "/dashboard"
      }
    ]
  },
  {
    title: "Core AI Tools",
    tools: [
      { 
        icon: Sparkles, 
        label: "Code Generation", 
        description: "Generate code from natural language",
        path: "/dashboard/generate",
        popular: true
      },
      { 
        icon: BookOpen, 
        label: "Code Explanation", 
        description: "Get clear explanations for any code snippet",
        path: "/dashboard/explain",
        popular: true
      },
      { 
        icon: TestTube, 
        label: "Test Generator", 
        description: "Generate comprehensive test suites",
        path: "/dashboard/test"
      },
      { 
        icon: FileText, 
        label: "Documentation", 
        description: "Generate professional documentation",
        path: "/dashboard/docs",
        popular: true
      },
      { 
        icon: Play, 
        label: "Code Runner", 
        description: "Execute code directly in browser",
        path: "/dashboard/runner",
        popular: true
      }
    ]
  },
  {
    title: "Advanced Analysis",
    tools: [
      { 
        icon: Bug, 
        label: "Debug & Refactor", 
        description: "Find and fix bugs and performance issues",
        path: "/dashboard/debug"
      },
      { 
        icon: Zap, 
        label: "Code Optimizer", 
        description: "Optimize code performance",
        path: "/dashboard/optimize"
      },
      { 
        icon: Shield, 
        label: "Security Audit", 
        description: "Scan for vulnerabilities",
        path: "/dashboard/security"
      },
      { 
        icon: Code2, 
        label: "Code Conversion", 
        description: "Convert between languages",
        path: "/dashboard/convert"
      }
    ]
  },
  {
    title: "Utilities",
    tools: [
      { 
        icon: MessageSquare, 
        label: "AI Chat", 
        description: "Chat with AI coding assistant",
        path: "/dashboard/chat"
      }
    ]
  }
]; 

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed bottom-4 right-4 z-50 lg:hidden h-12 w-12 rounded-full shadow-lg bg-card/95 backdrop-blur-sm border border-border"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
      </Button>

      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? 'opacity-100 lg:opacity-0 pointer-events-auto' : 'opacity-0 pointer-events-none',
          'lg:hidden'
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-card/95 backdrop-blur-sm border-r border-border shadow-lg",
          "transform transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "flex flex-col h-full",
          "lg:w-72 xl:w-80"
        )}
        aria-label="Main navigation"
      >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 pt-8">
        {/* Navigation Sections */}
        <div className="space-y-8">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {/* Section Header */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>

              {/* Section Tools */}
              <div className="space-y-1">
                {section.tools.map((tool) => (
                  <NavLink
                    key={tool.path}
                    to={tool.path}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                        "hover:bg-accent/80 hover:shadow-sm border border-transparent",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isActive && "bg-accent border-primary/30 shadow-sm"
                      )
                    }
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <tool.icon className={cn(
                        "w-4 h-4 transition-colors duration-200",
                        "text-primary group-hover:text-primary/80"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground text-sm group-hover:text-foreground/90 transition-colors">
                          {tool.label}
                        </h3>
                        {tool.popular && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            <Star className="w-2.5 h-2.5 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">A&B CodeDev</span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI-Powered Development Tools
            </p>
          </div>
        </div>
      </div>
    </aside>
  </>
  );
};
