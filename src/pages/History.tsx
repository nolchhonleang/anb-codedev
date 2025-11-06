import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Code2, FileText } from "lucide-react";

const historyItems = [
  {
    id: 1,
    type: "Code Conversion",
    from: "Python",
    to: "JavaScript",
    timestamp: "2 hours ago",
    preview: "def hello_world():",
  },
  {
    id: 2,
    type: "Code Generation",
    description: "React component for user authentication",
    timestamp: "5 hours ago",
    preview: "import React from 'react';",
  },
  {
    id: 3,
    type: "Debug & Refactor",
    description: "Fixed memory leak in event listeners",
    timestamp: "Yesterday",
    preview: "addEventListener('click', handler)",
  },
];

const History = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">History</h1>
          <p className="text-muted-foreground">View your recent AI interactions</p>
        </div>

        <div className="space-y-4">
          {historyItems.map((item) => (
            <Card
              key={item.id}
              className="p-6 bg-gradient-card border-border hover:shadow-glow transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.type}</h3>
                    {item.from && item.to && (
                      <p className="text-sm text-muted-foreground">
                        {item.from} → {item.to}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {item.timestamp}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-md p-3 font-mono text-sm text-foreground">
                {item.preview}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default History;
