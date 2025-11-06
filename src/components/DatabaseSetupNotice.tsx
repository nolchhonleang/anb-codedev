import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink, Copy } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function DatabaseSetupNotice() {
  const [showSQL, setShowSQL] = useState(false);
  const { toast } = useToast();

  const sqlScript = `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();`;

  const copySQL = () => {
    navigator.clipboard.writeText(sqlScript);
    toast({
      title: "SQL Copied",
      description: "Database setup script copied to clipboard",
    });
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard/project/iwvgfehzqtwumvpobrsy/sql', '_blank');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <Database className="w-5 h-5" />
          Database Setup Required
        </CardTitle>
        <CardDescription className="text-yellow-600 dark:text-yellow-400">
          The application is running with mock data. Set up your database for full functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Quick Setup:</h3>
          <ol className="text-sm space-y-1 text-muted-foreground">
            <li>1. Open your Supabase SQL Editor</li>
            <li>2. Copy and run the database setup script</li>
            <li>3. Refresh this page</li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={openSupabase} size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Open Supabase SQL Editor
          </Button>
          <Button onClick={() => setShowSQL(!showSQL)} variant="outline" size="sm">
            {showSQL ? 'Hide' : 'Show'} SQL Script
          </Button>
        </div>

        {showSQL && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Setup Script:</span>
              <Button onClick={copySQL} variant="ghost" size="sm" className="gap-2">
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </div>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
              {sqlScript}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Note:</strong> The app will continue to work with mock data until you set up the database.
          All features are functional, but user data won't be persisted.
        </div>
      </CardContent>
    </Card>
  );
}
