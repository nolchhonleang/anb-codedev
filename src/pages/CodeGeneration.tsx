'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { AIService } from "@/services/AIService";
import {
  Copy,
  Download,
  Sparkles,
  Loader2,
  Check,
  Code as CodeIcon,
  FileText,
  Zap,
  RotateCcw,
  ClipboardPaste,
  Share2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                 Types & Data                               */
/* -------------------------------------------------------------------------- */
interface CodeGenerationState {
  prompt: string;
  language: string;
  codeType: string;
  complexity: string;
  requirements: string;
  generatedCode: string;
  isGenerating: boolean;
  isCopied: boolean;
}

const languages = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dart", label: "Dart" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
];

const codeTypes = [
  { value: "function", label: "Function" },
  { value: "class", label: "Class" },
  { value: "api", label: "API Endpoint" },
  { value: "component", label: "UI Component" },
  { value: "algorithm", label: "Algorithm" },
  { value: "utility", label: "Utility" },
  { value: "database", label: "Database" },
  { value: "test", label: "Test Code" },
];

const complexityLevels = [
  { value: "simple", label: "Simple" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

/* -------------------------------------------------------------------------- */
/*                               AI Generation                                */
/* -------------------------------------------------------------------------- */
const generateIntelligentCode = async (params: {
  description: string;
  language: string;
  codeType: string;
  complexity: string;
  requirements: string;
  userId?: string;
}): Promise<string> => {
  try {
    let prompt = `Generate ${params.language} code that: ${params.description}\n`;
    if (params.requirements) prompt += `\nRequirements:\n${params.requirements}\n`;
    prompt += `\nCode Type: ${params.codeType || "general"}\n`;
    prompt += `Complexity: ${params.complexity || "intermediate"}\n`;

    const result = await AIService.generateCode(prompt, params.language);
    return result.replace(/^```[\w]*\n?([\s\S]*?)\n?```$/g, "$1").trim();
  } catch (e) {
    console.error(e);
    return generateSmartCode(
      params.description,
      params.language,
      params.codeType,
      params.complexity,
      params.requirements
    );
  }
};

const generateSmartCode = (
  description: string,
  language: string,
  codeType: string,
  _complexity: string,
  _requirements: string
) => {
  const map: Record<string, Record<string, string>> = {
    component: {
      javascript: `// React Component\nexport default function MyComponent() {\n  return <div>${description}</div>;\n}`,
      typescript: `// React TS Component\ninterface Props {}\nexport default function MyComponent(props: Props) {\n  return <div>${description}</div>;\n}`,
    },
    api: {
      javascript: `// Express route\napp.get('/api/data', (req, res) => res.json({msg: '${description}'}));`,
    },
  };
  const key = codeType.toLowerCase();
  const langKey = language === "typescript" ? "typescript" : "javascript";
  return map[key]?.[langKey] ?? `// ${language} – ${description}\nconsole.log("fallback");`;
};

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */
export default function CodeGeneration() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [state, setState] = useState<CodeGenerationState>({
    prompt: "",
    language: "javascript",
    codeType: "function",
    complexity: "intermediate",
    requirements: "",
    generatedCode: "",
    isGenerating: false,
    isCopied: false,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateState = useCallback(
    (updates: Partial<CodeGenerationState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  /* ---- Auto-resize textarea ---- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  }, [state.prompt]);

  /* ---- Save to localStorage history ---- */
  const saveToHistory = useCallback(
    (prompt: string, code: string, language: string) => {
      const item = {
        id: Date.now().toString(),
        prompt,
        code,
        language,
        timestamp: Date.now(),
      };
      const hist = JSON.parse(localStorage.getItem("codeGenHist") || "[]");
      localStorage.setItem("codeGenHist", JSON.stringify([item, ...hist].slice(0, 50)));
    },
    []
  );

  /* ---- Generate ---- */
  const handleGenerate = useCallback(async () => {
    if (!state.prompt.trim()) {
      toast({ title: "Missing prompt", description: "Please describe the code you need." });
      return;
    }
    updateState({ isGenerating: true });
    try {
      const code = await generateIntelligentCode({
        description: state.prompt,
        language: state.language,
        codeType: state.codeType,
        complexity: state.complexity,
        requirements: state.requirements,
        userId: user?.id,
      });
      saveToHistory(state.prompt, code, state.language);
      updateState({ generatedCode: code });
      toast({ title: "Success", description: "Code generated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed", variant: "destructive" });
    } finally {
      updateState({ isGenerating: false });
    }
  }, [state, user, toast, updateState, saveToHistory]);

  /* ---- Copy / Download ---- */
  const handleCopy = useCallback(async () => {
    if (!state.generatedCode) return;
    await navigator.clipboard.writeText(state.generatedCode);
    updateState({ isCopied: true });
    toast({ title: "Copied!" });
    setTimeout(() => updateState({ isCopied: false }), 2000);
  }, [state.generatedCode, toast, updateState]);

  const handleDownload = useCallback(() => {
    if (!state.generatedCode) return;
    const blob = new Blob([state.generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-${Date.now()}.${state.language}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded" });
  }, [state.generatedCode, state.language, toast]);

  /* ---- Toolbar actions ---- */
  const handleClear = useCallback(() => {
    updateState({
      prompt: "",
      generatedCode: "",
      language: "javascript",
      codeType: "function",
      complexity: "intermediate",
      requirements: "",
    });
    toast({ title: "Cleared", description: "All fields reset." });
  }, [toast, updateState]);

  const handlePasteExample = useCallback(() => {
    const ex = "Create a responsive React card component with image, title, description and a button. Use TypeScript and Tailwind.";
    updateState({
      prompt: ex,
      language: "typescript",
      codeType: "component",
    });
    toast({ title: "Example pasted" });
  }, [toast, updateState]);

  const handleShare = useCallback(() => {
    const p = new URLSearchParams({
      prompt: encodeURIComponent(state.prompt),
      lang: state.language,
      type: state.codeType,
      complexity: state.complexity,
    });
    const url = `${window.location.origin}${window.location.pathname}?${p}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Shareable URL ready." });
  }, [state, toast]);

  /* ---- Load from URL ---- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    if (p) {
      updateState({
        prompt: decodeURIComponent(p),
        language: params.get("lang") ?? "javascript",
        codeType: params.get("type") ?? "function",
        complexity: params.get("complexity") ?? "intermediate",
      });
    }
  }, [updateState]);

  /* ---------------------------------------------------------------------- */
  /*                                 UI                                      */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-background to-muted/10">
      <div className="max-w-6xl mx-auto">

        {/* ---- Header ---- */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI Code Generator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Describe your idea — get clean, production-ready code instantly.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              AI-Powered
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs">
              Production Ready
            </Badge>
          </div>

          {/* Toolbar – **Advanced button removed** */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handlePasteExample}>
              Example
            </Button>
            {state.prompt && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                Share
              </Button>
            )}
          </div>
        </div>

        {/* ---- Input Card ---- */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl flex items-center">
              Code Generation
            </CardTitle>
            <CardDescription>Describe what you want in plain English</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">

            {/* Language + Code Type + Complexity (always visible) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={state.language} onValueChange={(v) => updateState({ language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Code Type</Label>
                <Select value={state.codeType} onValueChange={(v) => updateState({ codeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {codeTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={state.complexity} onValueChange={(v) => updateState({ complexity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {complexityLevels.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Description</Label>
                <span className="text-muted-foreground">{state.prompt.length} chars</span>
              </div>
              <Textarea
                ref={textareaRef}
                value={state.prompt}
                onChange={(e) => updateState({ prompt: e.target.value })}
                placeholder="e.g., Create a login form with email validation..."
                className="min-h-[140px] text-base"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tip: Be specific</span>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl + Enter</kbd>
              </div>
            </div>

            {/* Optional requirements (always visible) */}
            <div className="space-y-2">
              <Label>Extra Requirements (optional)</Label>
              <Textarea
                value={state.requirements}
                onChange={(e) => updateState({ requirements: e.target.value })}
                placeholder="e.g., Use hooks, add JSDoc, handle errors..."
                className="min-h-[80px] text-sm"
              />
            </div>

            {/* Generate button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={state.isGenerating || !state.prompt.trim()}
                className="h-11 px-6 bg-gradient-to-r from-primary to-primary/90"
                size="lg"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ---- Output Card ---- */}
        {state.generatedCode && (
          <Card className="mt-8 border-0 shadow-lg">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Generated Code</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="secondary">{state.language}</Badge>
                    <span>{state.generatedCode.split("\n").length} lines</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {state.isCopied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SyntaxHighlighter
                language={state.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: "1.25rem", fontSize: "0.875rem" }}
                showLineNumbers
                wrapLines
              >
                {state.generatedCode}
              </SyntaxHighlighter>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}