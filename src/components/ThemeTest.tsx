import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeTest() {
  const { theme, isDarkMode } = useTheme();
  
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };
  
  return (
    <Card className="w-full max-w-sm sm:max-w-md border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          {getThemeIcon()}
          Theme Status
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Current theme configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <span className="text-xs sm:text-sm font-medium">Selected:</span>
            <Badge variant="outline" className="text-xs capitalize">
              {theme}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <span className="text-xs sm:text-sm font-medium">Active:</span>
            <Badge variant={isDarkMode ? "default" : "secondary"} className="text-xs capitalize">
              {theme}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <span className="text-xs sm:text-sm font-medium">Dark Mode:</span>
            <Badge variant={isDarkMode ? "default" : "outline"} className="text-xs">
              {isDarkMode ? "On" : "Off"}
            </Badge>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            ✨ Theme system is working! Use the theme toggle to switch between modes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
