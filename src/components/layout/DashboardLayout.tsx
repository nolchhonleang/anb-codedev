import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Code2 } from "lucide-react";

export const DashboardLayout = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <TopBar />
      <div className="flex flex-1 w-full relative">
        <Sidebar />
        <main className="flex-1 overflow-auto lg:ml-72 md:ml-0 transition-all duration-300">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
