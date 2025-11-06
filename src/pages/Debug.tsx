import { ThemeTest } from "@/components/ThemeTest";
import { ApiTest } from "@/components/ApiTest";
import { DebugInfo } from "@/components/DebugInfo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";

const Debug = () => {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 flex items-center justify-center gap-2">
              <Settings className="w-8 h-8" />
              Debug & Testing Tools
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Development tools for testing API connections, theme functionality, and debugging configuration issues.
            </p>
          </div>
        </div>

        {/* Debug Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ThemeTest />
          <ApiTest />
          <DebugInfo />
        </div>

        {/* Additional Info */}
        <Card className="border-2 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Development Notes</CardTitle>
            <CardDescription>
              Important information for developers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Database Setup</h3>
                <p className="text-xs text-muted-foreground">
                  Run the SQL script in <code>src/utils/database-setup.sql</code> in your Supabase SQL editor to create the necessary tables.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Edge Functions</h3>
                <p className="text-xs text-muted-foreground">
                  Deploy <code>ai-chat</code> and <code>run-code</code> functions to Supabase for full AI and code execution functionality.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Environment Variables</h3>
                <p className="text-xs text-muted-foreground">
                  Ensure all Supabase environment variables are set in your <code>.env</code> file and restart the dev server if changed.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Access This Page</h3>
                <p className="text-xs text-muted-foreground">
                  Visit <code>/debug</code> anytime to access these development tools without cluttering the main dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Debug;
