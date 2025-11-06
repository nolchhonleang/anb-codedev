import { Code2, History, Sun, Moon, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface CodeHistory {
  id: string;
  prompt: string;
  code: string;
  language: string;
  timestamp: number;
}

export const TopBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useState<CodeHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('codeGenerationHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Failed to load history', error);
      }
    }
  }, []);

  // Listen for storage events to update history across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'codeGenerationHistory' && e.newValue) {
        try {
          const newHistory = JSON.parse(e.newValue);
          if (Array.isArray(newHistory)) {
            setHistory(newHistory);
          }
        } catch (error) {
          console.error('Failed to parse history from storage', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-[60] shadow-sm">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md">
            <Code2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-foreground truncate">A&B CodeDev</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">AI Code Assistant</p>
          </div>
        </Link>

        {/* Navigation Buttons - Always Visible */}
        <div className="flex items-center gap-1 sm:gap-2">
          <DropdownMenu open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 relative">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-xs rounded-full bg-primary text-primary-foreground">
                    {history.length > 9 ? '9+' : history.length}
                  </span>
                )}
                <span className="sr-only">History</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-[60vh] overflow-y-auto" align="end">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Recent Generations</h3>
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all history?')) {
                          localStorage.removeItem('codeGenerationHistory');
                          setHistory([]);
                        }
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>No history yet</p>
                    <p>Your generated code will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                        onClick={() => {
                          // Handle history item click (you can implement this)
                          console.log('Selected history item:', item);
                          setIsHistoryOpen(false);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium line-clamp-2">
                            {item.prompt}
                          </div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                            {item.language}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>

        {/* Mobile Navigation - Only show menu button on mobile */}
        {/* <div className="sm:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-4 h-4" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <ThemeToggle className="sm:hidden" />
        </div> */}
      </div>
    </header>
  );
};
