'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Copy,
  Download,
  Zap,
  BookOpen,
  Lightbulb,
  GraduationCap,
  User,
  Info,
  Code2,
  Share2,
  FileDown,
  RotateCcw,
  ClipboardPaste,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateRequired } from "@/utils/errorHandler";
import { AIService } from "@/services/AIService";
import { detectLanguage } from "@/utils/codeAnalysis";

/* Syntax Highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

/* PDF Export */
import jsPDF from "jspdf";

interface Level {
  value: string;
  label: string;
  description: string;
  icon: React.FC<any>;
  prompt: string;
}

const explanationLevels: Level[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Explain like I'm 10 — simple words, fun analogies",
    icon: GraduationCap,
    prompt: "Explain like I'm 10. Use everyday words. Short sentences. Fun analogies. No jargon. One idea per line.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Clear technical explanation with real terms",
    icon: User,
    prompt: "Explain how parts connect. Use real code terms. Mention patterns. Keep it readable. One comment per line.",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Deep dive: complexity, edge cases, optimizations",
    icon: Lightbulb,
    prompt: "Deep dive: time/space complexity, edge cases, optimizations, design trade-offs, best practices. Be concise.",
  },
];

/* Example Code */
const exampleCode = `function greet(name) {
  if (name) {
    return \`Hello, \${name}!\`;
  }
  return "Hello!";
}

console.log(greet("Alice"));`;

export default function CodeExplanation() {
  const [sourceCode, setSourceCode] = useState("");
  const [explanationLevel, setExplanationLevel] = useState("beginner");
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [activeTab, setActiveTab] = useState("explain");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const outputRef = useRef<HTMLDivElement>(null);

  // Detect theme
  const theme = typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";

  /* Language detection */
  const detectedLanguage = useMemo(() => {
    if (!sourceCode.trim()) return null;
    const result = detectLanguage(sourceCode);
    setDetectedLang(result.language);
    return result.language;
  }, [sourceCode]);

  /* Explain handler — SAFE FROM JSX */
  const handleExplain = useCallback(async () => {
    if (!validateRequired(sourceCode, "Source Code")) {
      toast({ title: "No Code", description: "Paste code first.", variant: "destructive" });
      return;
    }

    const trimmed = sourceCode.trim();

    // BLOCK JSX/HTML EARLY
    if (
      /<Card|className|ref=|React\.|tsx|jsx|<\w+/.test(trimmed) ||
      trimmed.includes("<div") ||
      trimmed.includes("return (")
    ) {
      toast({
        title: "Invalid Input",
        description: "Please paste real code (JS, Python, etc.), not React/HTML components.",
        variant: "destructive",
      });
      return;
    }

    setIsExplaining(true);
    try {
      const level = explanationLevels.find((l) => l.value === explanationLevel) ?? explanationLevels[0];

      const prompt = `You are a code-commenting robot. Add ONE // comment ABOVE each line/block.

STYLE: ${level.prompt}

RULES:
1. Output ONLY code + // comments
2. NO markdown, NO \`\`\`, NO extra text
3. Preserve EXACT indentation and formatting
4. Use // for ALL languages
5. One comment per line or logical block
6. Original code 100% unchanged
7. If input is JSX/HTML, respond: "ERROR: JSX detected."

CODE TO EXPLAIN:
${sourceCode}

OUTPUT ONLY CODE + COMMENTS.`;

      let result = await AIService.chatCompletion([
        {
          role: "system",
          content: `You are a code explainer. Style: ${level.prompt}. Return ONLY code with // comments above each line. No markdown. No extra text.`,
        },
        { role: "user", content: prompt },
      ]);

      // Clean output
      result = result
        .replace(/```[\w]*\n?/g, "")
        .replace(/```/g, "")
        .replace(/[\r\n]+/g, "\n")
        .replace(/(\n\s*){3,}/g, "\n\n")
        .trim();

      // AI detected JSX
      if (result.includes("ERROR: JSX")) {
        toast({
          title: "Invalid Code",
          description: "This looks like React/JSX. Please paste real code to explain.",
          variant: "destructive",
        });
        setIsExplaining(false);
        return;
      }

      // Fallback: keyword-based comments
      if (!result.includes("//") || result.length < sourceCode.length * 0.6) {
        const map: Record<string, string> = {
          function: "Define a function",
          let: "Create a variable",
          const: "Create a constant",
          var: "Create a variable",
          return: "Return a value",
          if: "Check condition",
          else: "Otherwise",
          for: "Loop over items",
          while: "Loop while true",
          try: "Try to run code",
          catch: "Catch errors",
          throw: "Throw an error",
          class: "Define a class",
          import: "Import module",
          from: "Import from module",
          export: "Export something",
          def: "Define a function (Python)",
          print: "Print output",
          console: "Print to console",
          async: "Run asynchronously",
          await: "Wait for promise",
        };

        result = sourceCode
          .split("\n")
          .map((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return line;
            const first = trimmedLine.split(" ")[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
            const comment = map[first] || "Do something";
            return `// ${comment}\n${line}`;
          })
          .join("\n");
      }

      setExplanation(result);
      setActiveTab("result");

      // Save to Supabase
      if (user) {
        try {
          await supabase.from("code_executions").insert({
            user_id: user.id,
            language: `explain-${detectedLang || "unknown"}`,
            code: sourceCode,
            output: result,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Supabase save failed", e);
        }
      }

      toast({ title: "Done!", description: `${level.label} explanation ready.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to explain.", variant: "destructive" });
    } finally {
      setIsExplaining(false);
    }
  }, [sourceCode, explanationLevel, user, toast, detectedLang]);

  /* Copy */
  const handleCopy = useCallback(() => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    toast({ title: "Copied!", description: "Code + comments copied." });
  }, [explanation, toast]);

  /* Download TXT */
  const handleDownload = useCallback(() => {
    if (!explanation) return;
    const blob = new Blob([explanation], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explained_${explanationLevel}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Saved as .txt" });
  }, [explanation, explanationLevel, toast]);

  /* Share Link */
  const handleShare = useCallback(() => {
    if (!explanation) return;
    const params = new URLSearchParams({
      code: btoa(encodeURIComponent(sourceCode)),
      level: explanationLevel,
      lang: detectedLang || "unknown",
    });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Shareable URL ready." });
  }, [sourceCode, explanationLevel, detectedLang, explanation, toast]);

  /* Export PDF */
  const handleExportPDF = useCallback(() => {
    if (!explanation) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    pdf.setFontSize(16);
    pdf.text("Code Explanation", pageWidth / 2, y, { align: "center" });
    y += 15;

    pdf.setFontSize(12);
    pdf.text(`Level: ${explanationLevels.find((l) => l.value === explanationLevel)?.label}`, 20, y);
    y += 8;
    pdf.text(`Language: ${detectedLang || "Unknown"}`, 20, y);
    y += 15;

    pdf.setFontSize(10);
    pdf.setFont("courier");

    const lines = explanation.split("\n");
    lines.forEach((line) => {
      if (y > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        y = 20;
      }
      const prefix = line.trim().startsWith("//") ? "// " : "   ";
      const text = line.trim().startsWith("//") ? line.slice(2).trim() : line;
      pdf.text(prefix + text, 15, y);
      y += 6;
    });

    pdf.save(`explanation_${explanationLevel}.pdf`);
    toast({ title: "PDF Exported", description: "Saved to your device." });
  }, [explanation, explanationLevel, detectedLang, toast]);

  /* Clear */
  const handleClear = useCallback(() => {
    setSourceCode("");
    setExplanation("");
    setActiveTab("explain");
    toast({ title: "Cleared", description: "All fields reset." });
  }, [toast]);

  /* Paste Example */
  const handlePasteExample = useCallback(() => {
    setSourceCode(exampleCode);
    toast({ title: "Example Pasted", description: "Try explaining it!" });
  }, [toast]);

  /* Load from URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const level = params.get("level");
    if (code) {
      const decoded = decodeURIComponent(atob(code));
      // Double-check it's not JSX
      if (!/<\w+|className|ref=/.test(decoded)) {
        setSourceCode(decoded);
        if (level && explanationLevels.some((l) => l.value === level)) {
          setExplanationLevel(level);
        }
      }
    }
  }, []);

  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-background to-muted/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Code Explanation
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste any code and get clear, line-by-line explanations
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <Badge variant="secondary" className="text-xs"><BookOpen className="w-3 h-3 mr-1" /> AI</Badge>
            <Badge variant="secondary" className="text-xs"><Zap className="w-3 h-3 mr-1" /> Line-by-Line</Badge>
            <Badge variant="secondary" className="text-xs"><Lightbulb className="w-3 h-3 mr-1" /> 3 Levels</Badge>
            {detectedLang && <Badge variant="outline" className="text-xs"><Code2 className="w-3 h-3 mr-1" /> {detectedLang}</Badge>}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handlePasteExample}>
              <ClipboardPaste className="w-3.5 h-3.5 mr-1" /> Example
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="explain">Explain</TabsTrigger>
            <TabsTrigger value="result" disabled={!explanation}>Result</TabsTrigger>
          </TabsList>

          {/* INPUT TAB */}
          <TabsContent value="explain" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Code2 className="w-5 h-5" /> Source Code</CardTitle>
                  <CardDescription>Paste your code below</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your code here..."
                    className="min-h-[420px] font-mono text-sm resize-none"
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                  />
                  {detectedLang && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Detected: <code className="px-1 bg-muted rounded">{detectedLang}</code>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Explanation Level</CardTitle>
                  <CardDescription>Choose your depth</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {explanationLevels.map((lvl) => {
                    const Icon = lvl.icon;
                    return (
                      <div
                        key={lvl.value}
                        onClick={() => setExplanationLevel(lvl.value)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                          explanationLevel === lvl.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            explanationLevel === lvl.value ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-sm">{lvl.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{lvl.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleExplain}
                disabled={isExplaining || !sourceCode.trim()}
                className="min-w-[180px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              >
                {isExplaining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Explaining...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Explain Code
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* RESULT TAB */}
          <TabsContent value="result" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">Line-by-Line Explanation</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Info className="w-4 h-4" />
                      <span>Each line has a comment above it</span>
                      {explanationLevel && (
                        <>
                          <span className="mx-2">•</span>
                          <Badge variant="secondary" className="text-xs">
                            {explanationLevels.find((l) => l.value === explanationLevel)?.label}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!explanation}>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={!explanation}>
                      <Download className="w-4 h-4 mr-2" /> TXT
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!explanation}>
                      <FileDown className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare} disabled={!explanation}>
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent ref={outputRef}>
                {explanation ? (
                  <div className="rounded-lg overflow-hidden border">
                    <SyntaxHighlighter
                      language={detectedLang || "text"}
                      style={theme === "dark" ? vscDarkPlus : oneLight}
                      showLineNumbers
                      customStyle={{ margin: 0, fontSize: "0.875rem" }}
                      lineProps={{ style: { wordBreak: "break-all", whiteSpace: "pre-wrap" } }}
                      wrapLines
                    >
                      {explanation}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <div className="p-12 bg-muted/20 rounded-lg border border-dashed text-center">
                    <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h3 className="font-medium">No Explanation Yet</h3>
                    <p className="text-muted-foreground mt-1">Paste code and click "Explain Code"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}