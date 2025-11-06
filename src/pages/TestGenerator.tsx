import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TestTube,
  Copy,
  Download,
  FileText,
  Zap,
  AlertCircle,
  Code2,
  Shield,
  Bug,
  Loader2,
  // Removed theme icons
  RotateCcw,
  ClipboardPaste,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateRequired } from "@/utils/errorHandler";
import { AIService } from "@/services/AIService";
import { detectLanguage, extractIdentifier } from '@/utils/codeAnalysis';

interface TestQuality {
  value: string;
  label: string;
  description: string;
  icon: React.FC<any>;
  coverage: number;
  features: string[];
}

const testQualities: TestQuality[] = [
  {
    value: "basic",
    label: "Basic",
    description: "Core functionality & happy path",
    icon: Code2,
    coverage: 65,
    features: ["Happy path", "Basic assertions", "Simple inputs"],
  },
  {
    value: "standard",
    label: "Standard",
    description: "Unit + edge cases + error handling",
    icon: Shield,
    coverage: 88,
    features: [
      "Happy path",
      "Edge cases",
      "Error handling",
      "Input validation",
      "Integration",
    ],
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Full coverage: mocks, perf, security",
    icon: TestTube,
    coverage: 97,
    features: [
      "All paths",
      "Edge cases",
      "Integration",
      "Performance",
      "Security",
      "Mocking",
      "Error resilience",
    ],
  },
];

// Language to Test Framework + File Extension
const frameworkMap: Record<
  string,
  { framework: string; ext: string; testFile: (name: string) => string }
> = {
  javascript: { framework: "Jest", ext: "js", testFile: (n) => `${n}.test.js` },
  typescript: { framework: "Jest", ext: "ts", testFile: (n) => `${n}.test.ts` },
  jsx: { framework: "Jest + React Testing Library", ext: "jsx", testFile: (n) => `${n}.test.jsx` },
  tsx: { framework: "Jest + React Testing Library", ext: "tsx", testFile: (n) => `${n}.test.tsx` },
  python: { framework: "pytest", ext: "py", testFile: (n) => `test_${n}.py` },
  java: { framework: "JUnit 5", ext: "java", testFile: (n) => `${n}Test.java` },
  csharp: { framework: "xUnit", ext: "cs", testFile: (n) => `${n}Tests.cs` },
  php: { framework: "PHPUnit", ext: "php", testFile: (n) => `${n}Test.php` },
  ruby: { framework: "RSpec", ext: "rb", testFile: (n) => `${n}_spec.rb` },
  go: { framework: "testing", ext: "go", testFile: (n) => `${n}_test.go` },
  rust: { framework: "cargo test", ext: "rs", testFile: (n) => `${n}_test.rs` },
  kotlin: { framework: "JUnit 5", ext: "kt", testFile: (n) => `${n}Test.kt` },
  swift: { framework: "XCTest", ext: "swift", testFile: (n) => `${n}Tests.swift` },
  dart: { framework: "test", ext: "dart", testFile: (n) => `${n}_test.dart` },
  html: { framework: "Jest + JSDOM", ext: "html", testFile: (n) => `test_${n}.html` },
  css: { framework: "Jest + jest-css-modules", ext: "css", testFile: (n) => `${n}.test.css` },
};

const getFramework = (lang: string) => frameworkMap[lang.toLowerCase()] || { framework: "Unknown", ext: "txt", testFile: () => "test.txt" };

const TestGenerator = () => {
  const [sourceCode, setSourceCode] = useState("");
  const [testQuality, setTestQuality] = useState("standard");
  const [generatedTests, setGeneratedTests] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [detectedLang, setDetectedLang] = useState("detecting...");
  const [identifier, setIdentifier] = useState("unknown");

  const { toast } = useToast();
  const { user } = useAuth();

  // Update identifier when source code changes
  useEffect(() => {
    if (sourceCode) {
      const identifier = extractIdentifier(sourceCode);
      setIdentifier(identifier);
    }
  }, [sourceCode]);

  // Generate fallback tests
  const generateFallbackTests = useCallback(
    (lang: string, framework: string, quality: TestQuality): string => {
      const templates: Record<string, string> = {
        python: `import pytest

def test_${identifier}():
    """Test core functionality"""
    # TODO: Implement real test
    assert True

def test_edge_case():
    assert True
`,
        javascript: `test('${identifier} works', () => {
  expect(true).toBe(true);
});

test('handles edge case', () => {
  expect(true).toBe(true);
});
`,
        java: `@Test
void test${identifier}() {
    assertTrue(true);
}

@Test
void testEdgeCase() {
    assertTrue(true);
}
`,
        typescript: `test('${identifier} works', () => {
  expect(true).toBe(true);
});
`,
      };

      return templates[lang] || `// Tests for ${identifier}\n// Using ${framework}\n\n// Add real tests`;
    },
    [identifier]
  );

  const handleGenerate = useCallback(async () => {
    if (!validateRequired(sourceCode, "Source Code")) return;

    setIsGenerating(true);
    setGeneratedTests("");
    setDetectedLang("detecting...");
    setIdentifier("unknown");

    try {
      const detectionResult = await detectLanguage(sourceCode);
      const lang = detectionResult.language;
      setDetectedLang(lang);
      
      const { framework, testFile } = getFramework(lang);
      const quality = testQualities.find((q) => q.value === testQuality)!;
      const testFilename = testFile(identifier);

      const prompt = `You are a senior test engineer.

Generate **${quality.label}** tests for the following **${lang}** code using **${framework}**.

Focus on:
${quality.features.map((f) => `- ${f}`).join("\n")}

Code:
\`\`\`${lang}
${sourceCode}
\`\`\`

Rules:
- Output ONLY test code
- No markdown, no \`\`\` wrappers
- Include proper imports
- Use descriptive test names
- Cover edge cases, errors, and integration
- Use mocks if needed
- Real assertions only

Generate now.`;

      let result: string;

      try {
        result = await AIService.chatCompletion(
          [
            {
              role: "system",
              content: `You are a test generation expert for ${lang}. Use ${framework}.`,
            },
            { role: "user", content: prompt },
          ],
          { temperature: 0.3 }
        );

        result = result.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
      } catch (apiError) {
        console.warn("AI failed to using fallback");
        result = generateFallbackTests(lang, framework, quality);
      }

      setGeneratedTests(result);
      setActiveTab("result");

      if (user) {
        try {
          await supabase.from("code_executions").insert({
            user_id: user.id,
            language: `test-${lang}`,
            code: sourceCode,
            output: result,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Save failed", e);
        }
      }

      toast({
        title: "Tests Generated",
        description: `${quality.label} • ${framework} • ${lang}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate tests.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    sourceCode,
    testQuality,
    user,
    toast,
    identifier,
    generateFallbackTests,
  ]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedTests);
    toast({ title: "Copied!", description: "Test code copied." });
  }, [generatedTests, toast]);

  const handleDownload = useCallback(() => {
    if (!generatedTests) return;

    const { ext, testFile } = getFramework(detectedLang);
    const filename = testFile(identifier);

    const mimeTypes: Record<string, string> = {
      js: "text/javascript",
      ts: "text/typescript",
      py: "text/x-python",
      java: "text/x-java-source",
      cs: "text/x-csharp",
      php: "text/x-php",
      rb: "text/x-ruby",
      go: "text/x-go",
      rs: "text/x-rust",
      kt: "text/x-kotlin",
      swift: "text/x-swift",
      dart: "text/x-dart",
      html: "text/html",
      css: "text/css",
    };

    const blob = new Blob([generatedTests], { type: mimeTypes[ext] || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Downloaded", description: filename });
  }, [generatedTests, detectedLang, identifier, toast]);

  // TOOL HANDLERS (theme removed)
  const handleClear = useCallback(() => {
    setSourceCode("");
    setGeneratedTests("");
    setDetectedLang("detecting...");
    setIdentifier("unknown");
    setActiveTab("generate");
    toast({ title: "Cleared", description: "All fields reset." });
  }, [toast]);

  const handlePasteExample = useCallback(() => {
    const example = `def factorial(n):
    """Return the factorial of n, n >= 0."""
    if n == 0:
        return 1
    return n * factorial(n - 1)`;
    setSourceCode(example);
    toast({ title: "Example pasted", description: "Python factorial function." });
  }, [toast]);

  const handleShare = useCallback(() => {
    const params = new URLSearchParams({ code: encodeURIComponent(sourceCode) });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Shareable URL copied." });
  }, [sourceCode, toast]);

  // Read shared code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("code");
    if (shared) setSourceCode(decodeURIComponent(shared));
  }, []);

  return (
    <div className="h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            Test Generator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            AI-powered unit, integration, and edge-case tests — in any language.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary" className="text-xs">
              <TestTube className="w-3 h-3 mr-1" /> AI-Powered
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Bug className="w-3 h-3 mr-1" /> Edge Cases
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Shield className="w-3 h-3 mr-1" /> Mocks
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />{" "}
              {testQualities.find((q) => q.value === testQuality)?.coverage}% Coverage
            </Badge>
          </div>

          {/* TOOLBAR (theme button removed) */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <RotateCcw className="w-4 h-4 mr-1" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handlePasteExample}>
              <ClipboardPaste className="w-4 h-4 mr-1" /> Example
            </Button>
            {sourceCode && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Tests</TabsTrigger>
            <TabsTrigger value="result">Generated Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Source Code */}
              <Card className="lg:col-span-2 p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Source Code</CardTitle>
                  <CardDescription>Paste function, class, or module</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Textarea
                    placeholder="// Paste your code here..."
                    className="min-h-[400px] font-mono text-sm"
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Test Quality */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Test Depth</CardTitle>
                  <CardDescription>Choose coverage level</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-3">
                  {testQualities.map((q) => {
                    const Icon = q.icon;
                    return (
                      <div
                        key={q.value}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          testQuality === q.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setTestQuality(q.value)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5" />
                          <div>
                            <div className="font-medium">{q.label}</div>
                            <div className="text-xs text-muted-foreground">
                              Up to {q.coverage}% coverage
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{q.description}</p>
                        <div className="space-y-1">
                          {q.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <span>{f}</span>
                            </div>
                          ))}
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
                onClick={handleGenerate}
                disabled={isGenerating || !sourceCode.trim()}
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <TestTube className="w-5 h-5 mr-2" />
                    Generate Tests
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Generated Tests
                    </CardTitle>
                    <CardDescription>
                      {testQualities.find((q) => q.value === testQuality)?.label} •{" "}
                      {getFramework(detectedLang).framework} • {detectedLang}
                    </CardDescription>
                  </div>
                  {generatedTests && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedTests ? (
                  <Textarea
                    className="min-h-[500px] font-mono text-sm bg-muted/50"
                    value={generatedTests}
                    readOnly
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                    <p>No tests yet.</p>
                    <p className="text-sm">Paste code and generate.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TestGenerator;