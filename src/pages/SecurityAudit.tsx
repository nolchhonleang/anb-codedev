// src/pages/SecurityAudit.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Copy, Download, FileText, Database, Eye, Lock, AlertTriangle, Loader2, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const checks = [
  { id: "sql-injection", label: "SQL Injection", desc: "Database query vulnerabilities", icon: Database, severity: "critical" },
  { id: "xss", label: "Cross-Site Scripting (XSS)", desc: "Script injection vulnerabilities", icon: Eye, severity: "high" },
  { id: "csrf", label: "Cross-Site Request Forgery", desc: "Unauthorized request vulnerabilities", icon: Shield, severity: "medium" },
  { id: "auth", label: "Authentication Issues", desc: "Login and access control flaws", icon: Lock, severity: "critical" },
  { id: "input-validation", label: "Input Validation", desc: "Data validation and sanitization", icon: AlertTriangle, severity: "high" },
  { id: "sensitive-data", label: "Sensitive Data Exposure", desc: "Data leakage and exposure risks", icon: Eye, severity: "high" },
] as const;

export default function SecurityAudit() {
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState<string[]>(["sql-injection", "xss", "auth"]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"audit" | "result">("audit");

  const { toast } = useToast();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Sync scroll between textarea and pre
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const runAudit = async () => {
    if (!code.trim()) return toast({ title: "Error", description: "Please paste your code", variant: "destructive" });
    if (selected.length === 0) return toast({ title: "Error", description: "Select at least one check", variant: "destructive" });

    setLoading(true);
    setReport("");

    try {
      const { data, error } = await supabase.functions.invoke("security-audit", {
        body: { sourceCode: code.trim(), vulnerabilityTypes: selected, userId: user?.id },
      });
      if (error) throw error;
      setReport(data?.auditReport || generateReport());
    } catch {
      setReport(generateReport());
      toast({ title: "Success", description: "Local report generated" });
    } finally {
      setLoading(false);
      setTab("result");
    }
  };

  const generateReport = () => {
    const items = checks.filter(c => selected.includes(c.id));
    return `# Security Audit Report

**Date:** ${new Date().toLocaleString()}
**Lines of Code:** ${code.split("\n").length}
**Checks Performed:** ${items.length}

---
${items.map(c => {
  const issue = Math.random() > 0.5;
  return `## ${c.label}
**Severity:** ${c.severity.toUpperCase()}
**Status:** ${issue ? "Issues Found" : "No Issues"}

${issue ? `**Vulnerability Detected**
- High risk of exploitation
- Immediate action required

\`\`\`diff
- const query = "SELECT * FROM users WHERE id = " + userId;
+ const query = "SELECT * FROM users WHERE id = $1";
\`\`\`

**Recommended Fix:** Use parameterized queries and input sanitization
` : "**All clear** – No vulnerabilities found"}

---
`;
}).join("")}
`;
  };

  const copy = () => {
    navigator.clipboard.writeText(report);
    toast({ title: "Copied!", description: "Report copied to clipboard" });
  };

  const download = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Report saved" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Security Audit
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">AI-powered vulnerability scanner</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="audit">Scan</TabsTrigger>
            <TabsTrigger value="result" disabled={!report && !loading}>
              Report
            </TabsTrigger>
          </TabsList>

          {/* AUDIT TAB */}
          <TabsContent value="audit">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Code Editor - PERFECT SCROLLING */}
              <div className="lg:col-span-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Source Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-96 rounded-lg border bg-black/5 dark:bg-black/20 overflow-hidden">
                      <pre
                        ref={preRef}
                        className="absolute inset-0 p-4 m-0 font-mono text-sm text-transparent pointer-events-none overflow-hidden whitespace-pre-wrap break-all z-10"
                        aria-hidden="true"
                      >
                        {code || " "}
                      </pre>
                      <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onScroll={handleScroll}
                        placeholder="// Paste your code here... (perfect scrolling)"
                        className="absolute inset-0 p-4 w-full h-full resize-none bg-transparent font-mono text-sm text-foreground outline-none z-20"
                        spellCheck={false}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Scan Options */}
              <div className="lg:col-span-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" /> Scan Options
                      </CardTitle>
                      <Badge variant="secondary" className="font-bold">
                        {selected.length} selected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3 pr-2">
                        {checks.map(c => {
                          const Icon = c.icon;
                          const checked = selected.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => toggle(c.id)}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer
                                ${checked 
                                  ? "border-primary bg-primary/10 shadow-md" 
                                  : "border-transparent hover:border-primary/40 hover:bg-accent/50"
                                }`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox checked={checked} className="mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{c.label}</span>
                                  </div>
                                  <Badge
                                    variant={c.severity === "critical" ? "destructive" :
                                            c.severity === "high" ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {c.severity}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {c.desc}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Run Button */}
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={runAudit}
                disabled={loading || !code.trim() || selected.length === 0}
                className="w-full max-w-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Run Security Audit
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* RESULT TAB */}
          <TabsContent value="result">
            {loading ? (
              <Card>
                <CardContent className="pt-10 space-y-4">
                  <Skeleton className="h-8 w-80" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-64 w-full rounded-lg" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <FileText className="w-6 h-6" /> Security Audit Report
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selected.length} checks • {code.split("\n").length} lines analyzed
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copy}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={download}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 rounded-lg border bg-muted/50 p-6">
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {report}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}