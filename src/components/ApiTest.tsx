import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Database, Wifi } from 'lucide-react';

export function ApiTest() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      console.log('Testing Supabase connection...');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

      // First test: Simple health check
      const { data: healthData, error: healthError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (healthError) {
        console.error('Health check failed:', healthError);
        
        // If profiles table doesn't exist, that's expected - try a different approach
        if (healthError.code === 'PGRST116' || healthError.message.includes('relation "profiles" does not exist')) {
          // Try to test basic connection with auth
          const { data: authData, error: authError } = await supabase.auth.getSession();
          
          if (authError) {
            throw new Error(`Auth connection failed: ${authError.message}`);
          }
          
          setConnectionStatus('success');
          toast({
            title: "Connection Success",
            description: "Connected to Supabase (database tables may need setup)",
          });
          return;
        }
        
        throw healthError;
      }

      setConnectionStatus('success');
      toast({
        title: "Connection Success",
        description: "Successfully connected to Supabase database",
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Connection failed: ${errorMsg}`);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Supabase",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testAuth = async () => {
    setIsTestingAuth(true);
    setAuthStatus('idle');
    setErrorMessage('');

    try {
      // Test auth session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      setAuthStatus('success');
      toast({
        title: "Auth Test Success",
        description: session ? "User is authenticated" : "Auth system is working (no active session)",
      });
    } catch (error) {
      console.error('Auth test failed:', error);
      setAuthStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: "Auth Test Failed",
        description: "Failed to test authentication system",
        variant: "destructive",
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const getStatusIcon = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md border-2 border-blue-500/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Database className="w-4 h-4" />
          API Connection Test
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Test Supabase API connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Database Connection Test */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(connectionStatus)}
              <span className="text-sm font-medium">Database</span>
            </div>
            {getStatusBadge(connectionStatus)}
          </div>
          <Button
            onClick={testConnection}
            disabled={isTestingConnection}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Database Connection'
            )}
          </Button>
        </div>

        {/* Auth System Test */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus)}
              <span className="text-sm font-medium">Authentication</span>
            </div>
            {getStatusBadge(authStatus)}
          </div>
          <Button
            onClick={testAuth}
            disabled={isTestingAuth}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isTestingAuth ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Auth System'
            )}
          </Button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
              <strong>Error:</strong> {errorMessage}
            </p>
          </div>
        )}

        {/* Success Message */}
        {(connectionStatus === 'success' || authStatus === 'success') && !errorMessage && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed">
              ✅ API systems are working correctly!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
