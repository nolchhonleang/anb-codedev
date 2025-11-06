import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function DebugInfo() {
  const [showSensitive, setShowSensitive] = useState(false);
  const { toast } = useToast();

  const envVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_PUBLISHABLE_KEY': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PROJECT_ID': import.meta.env.VITE_SUPABASE_PROJECT_ID,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Configuration copied to clipboard",
    });
  };

  const maskSensitive = (value: string) => {
    if (!value) return 'Not set';
    if (!showSensitive) {
      return value.substring(0, 10) + '...' + value.substring(value.length - 4);
    }
    return value;
  };

  return (
    <Card className="w-full max-w-md border-2 border-yellow-500/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span>Debug Info</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSensitive(!showSensitive)}
          >
            {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Environment configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{key}:</span>
              <Badge variant={value ? "default" : "destructive"} className="text-xs">
                {value ? "Set" : "Missing"}
              </Badge>
            </div>
            {value && (
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                  {maskSensitive(value)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(value)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
            <strong>Note:</strong> If any values show "Missing", check your .env file and restart the dev server.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
