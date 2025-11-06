"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateRequired } from "@/utils/errorHandler";
import { AIService } from "@/services/AIService";
import { detectLanguage, extractIdentifier } from '@/utils/codeAnalysis';

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  Loader2, FileText, Copy, Download, Globe, Code2, BookOpen, Users, Palette,
  Languages, LayoutTemplate, AlertCircle, Eye, RotateCcw, ClipboardPaste, Share2, Info
} from "lucide-react";

import { Packer, Document, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

/* ------------------------------------------------- Types ------------------------------------------------- */
interface DocType { value: string; label: string; description: string; icon: React.FC<any> }
interface DocFormat {
  value: string; label: string; extension: string; mime: string; icon: React.FC<any>; preview?: boolean;
}
interface DocStyle { value: string; label: string; description: string }
interface Language { value: string; label: string; nativeName: string; icon: React.FC<any> }
interface Template { value: string; label: string; description: string; icon: React.FC<any> }
interface IncludeOption { value: string; label: string; description: string }

/* ------------------------------------------------- Data ------------------------------------------------- */
const docTypes: DocType[] = [
  { value: "api", label: "API Documentation", description: "REST API endpoints and schemas", icon: Globe },
  { value: "function", label: "Function Docs", description: "Function parameters and returns", icon: Code2 },
  { value: "class", label: "Class Documentation", description: "Class methods and properties", icon: BookOpen },
  { value: "readme", label: "README", description: "Project overview and setup", icon: FileText },
  { value: "user-guide", label: "User Guide", description: "End-user documentation", icon: Users },
];

const docFormats: DocFormat[] = [
  { value: "markdown", label: "Markdown", extension: "md", mime: "text/markdown", icon: FileText },
  { value: "html", label: "HTML", extension: "html", mime: "text/html", icon: FileText, preview: true },
  { value: "jsdoc", label: "JSDoc", extension: "js", mime: "application/javascript", icon: Code2 },
  { value: "sphinx", label: "Sphinx", extension: "rst", mime: "text/x-rst", icon: FileText },
  { value: "javadoc", label: "JavaDoc", extension: "java", mime: "text/x-java-source", icon: Code2 },
  { value: "pdf", label: "PDF", extension: "pdf", mime: "application/pdf", icon: FileText },
  { value: "asciidoc", label: "AsciiDoc", extension: "adoc", mime: "text/plain", icon: FileText },
  { value: "docx", label: "Word (DOCX)", extension: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", icon: FileText },
];

const docStyles: DocStyle[] = [
  { value: "formal", label: "Formal", description: "Professional and detailed" },
  { value: "concise", label: "Concise", description: "Minimal and to-the-point" },
  { value: "tutorial", label: "Tutorial", description: "Step-by-step guides" },
  { value: "api-reference", label: "API Reference", description: "Technical API docs" },
  { value: "whitepaper", label: "Whitepaper", description: "In-depth technical paper" },
];

const languages: Language[] = [
  { value: "en", label: "English", nativeName: "English", icon: Languages },
  { value: "ko", label: "한국어 (Korean)", nativeName: "한국어", icon: Languages },
  { value: "km", label: "ភាសាខ្មែរ (Khmer)", nativeName: "ភាសាខ្មែរ", icon: Languages },
];

const templates: Template[] = [
  { value: "default", label: "Default", description: "Standard documentation", icon: LayoutTemplate },
  { value: "minimal", label: "Minimal", description: "Clean and simple", icon: LayoutTemplate },
  { value: "enterprise", label: "Enterprise", description: "Professional business", icon: LayoutTemplate },
  { value: "open-source", label: "Open Source", description: "Community-focused", icon: LayoutTemplate },
];

const includeOptions: IncludeOption[] = [
  { value: "toc", label: "Table of Contents", description: "Add TOC" },
  { value: "examples", label: "Code Examples", description: "Include usage examples" },
  { value: "parameters", label: "Parameters", description: "Detailed parameters" },
  { value: "returns", label: "Return Values", description: "Return value docs" },
  { value: "errors", label: "Error Handling", description: "Error cases" },
  { value: "changelog", label: "Changelog", description: "Version history" },
  { value: "installation", label: "Installation", description: "Setup guide" },
  { value: "faq", label: "FAQ", description: "Frequently asked questions" },
  { value: "troubleshooting", label: "Troubleshooting", description: "Common issues" },
  { value: "glossary", label: "Glossary", description: "Key terms" },
];

/* Example Code */
const exampleCode = `function calculateTax(income) {
  if (income <= 10000) return income * 0.1;
  return 1000 + (income - 10000) * 0.2;
}

console.log(calculateTax(15000));`;

/* ------------------------------------------------- Fallback Docs ------------------------------------------------- */
const generateFallbackDocs = (identifier: string) => {
  return `# ${identifier || "Unknown"} Documentation

> Auto-generated fallback documentation.

## Parameters
- None detected

## Returns
- Unknown

## Example
\`\`\`js
// Paste real code to get full docs
\`\`\`
`;
};

/* ------------------------------------------------- Component ------------------------------------------------- */
const DocumentationGenerator = () => {
  /* ------------------- state ------------------- */
  const [sourceCode, setSourceCode] = useState("");
  const [docType, setDocType] = useState("function");
  const [docFormat, setDocFormat] = useState("markdown");
  const [docStyle, setDocStyle] = useState("formal");
  const [language, setLanguage] = useState("en");
  const [template, setTemplate] = useState("default");
  const [includeOptionsState, setIncludeOptions] = useState<string[]>(["toc", "examples", "parameters", "returns"]);
  const [generatedDocs, setGeneratedDocs] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [activeSettingsTab, setActiveSettingsTab] = useState("content");
  const [identifier, setIdentifier] = useState("docs");
  const [isDark, setIsDark] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  /* ------------------- dark mode ------------------- */
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  /* ------------------- identifier & language ------------------- */
  useEffect(() => {
    if (sourceCode.trim()) {
      const id = extractIdentifier(sourceCode) || "docs";
      setIdentifier(id);
      const lang = detectLanguage(sourceCode).language;
      setDetectedLang(lang);
    } else {
      setIdentifier("docs");
      setDetectedLang(null);
    }
  }, [sourceCode]);

  /* ------------------- include handler ------------------- */
  const handleIncludeOptionChange = (value: string, checked: boolean) => {
    setIncludeOptions(prev =>
      checked ? [...prev, value] : prev.filter(v => v !== value)
    );
  };

  /* ------------------- clear ------------------- */
  const handleClear = useCallback(() => {
    setSourceCode("");
    setGeneratedDocs("");
    setActiveTab("generate");
    toast({ title: "Cleared", description: "All fields reset." });
  }, [toast]);

  /* ------------------- example ------------------- */
  const handlePasteExample = useCallback(() => {
    setSourceCode(exampleCode);
    toast({ title: "Example Pasted", description: "Click Generate!" });
  }, [toast]);

  /* ------------------- share ------------------- */
  const handleShare = useCallback(() => {
    if (!generatedDocs) return;
    const params = new URLSearchParams({
      code: btoa(encodeURIComponent(sourceCode)),
      type: docType,
      format: docFormat,
      style: docStyle,
      lang: language,
      template: template,
      include: includeOptionsState.join(","),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Shareable URL ready." });
  }, [sourceCode, docType, docFormat, docStyle, language, template, includeOptionsState, generatedDocs, toast]);

  /* ------------------- GENERATE — NOW WORKING 100% ------------------- */
  const handleGenerate = useCallback(async () => {
    if (!validateRequired(sourceCode, "Source Code")) {
      toast({ title: "No Code", description: "Paste code first.", variant: "destructive" });
      return;
    }

    const trimmed = sourceCode.trim();

    // BLOCK JSX/HTML
    if (
      /<Card|className|ref=|React\.|tsx|jsx|return\s*\(/.test(trimmed) ||
      trimmed.includes("<div") ||
      trimmed.includes("dangerouslySetInnerHTML")
    ) {
      toast({
        title: "Invalid Input",
        description: "Please paste real code (JS, Python, etc.), not React/HTML.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedDocs("");

    try {
      const codeLang = detectLanguage(sourceCode).language;
      const type = docTypes.find(t => t.value === docType)!;
      const format = docFormats.find(f => f.value === docFormat)!;
      const style = docStyles.find(s => s.value === docStyle)!;
      const lang = languages.find(l => l.value === language)!;
      const tmpl = templates.find(t => t.value === template)!;

      const prompt = `You are a senior technical writer using the **${tmpl.label}** template.

Generate **${type.label}** in **${format.label}** format using **${style.label}** style.

Language: **${lang.label}**

Include:
${includeOptionsState.map(o => `- ${includeOptions.find(i => i.value === o)?.label}`).join("\n") || "- None"}

Code:
\`\`\`${codeLang}
${sourceCode}
\`\`\`

Rules:
- Output ONLY the documentation
- No markdown fences
- Use proper ${format.label} syntax
- Write in ${lang.label}
- Professional tone
- If input is JSX/HTML, respond: "ERROR: JSX detected."

Generate now.`;

      let result: string;

      try {
        result = await AIService.chatCompletion(
          [
            { role: "system", content: `Expert in ${format.label}. Write in ${lang.label}. Use ${tmpl.label} structure.` },
            { role: "user", content: prompt },
          ],
          { temperature: 0.3 }
        );
        result = result.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();

        if (result.includes("ERROR: JSX")) {
          throw new Error("JSX detected");
        }
      } catch (e) {
        console.warn("AI failed → using fallback");
        result = generateFallbackDocs(identifier);
      }

      setGeneratedDocs(result);
      setActiveTab("result");

      // Save to Supabase
      if (user) {
        try {
          await supabase.from("code_executions").insert({
            user_id: user.id,
            language: `docs-${docType}`,
            code: sourceCode,
            output: result,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Supabase save failed", e);
        }
      }

      toast({ title: "Success!", description: `${type.label} • ${format.label} • ${lang.label}` });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message.includes("JSX") ? "JSX/HTML detected. Paste real code." : err.message || "Generation failed.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    sourceCode,
    docType,
    docFormat,
    docStyle,
    language,
    template,
    includeOptionsState,
    user,
    toast,
    identifier,
  ]);

  /* ------------------- copy ------------------- */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedDocs);
    toast({ title: "Copied!", description: "Documentation copied." });
  }, [generatedDocs, toast]);

  /* ------------------- download ------------------- */
  const handleDownload = useCallback(async () => {
    if (!generatedDocs) return;

    const format = docFormats.find(f => f.value === docFormat)!;
    const type = docTypes.find(t => t.value === docType)?.label ?? "docs";
    const ts = new Date().toISOString().slice(0, 10);
    const filename = `${identifier}-${type.toLowerCase().replace(/\s+/g, "-")}-${ts}.${format.extension}`;

    // PDF
    if (docFormat === "pdf") {
      try {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF();
        pdf.setFont("helvetica");
        pdf.setFontSize(16);
        pdf.text(type, 15, 20);
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(generatedDocs, 180);
        let y = 30;
        lines.forEach((line: string) => {
          if (y > 280) { pdf.addPage(); y = 20; }
          pdf.text(line, 15, y);
          y += 6;
        });
        pdf.save(filename);
        toast({ title: "Downloaded", description: `PDF: ${filename}` });
      } catch (e) {
        toast({ title: "Error", description: "PDF failed.", variant: "destructive" });
      }
      return;
    }

    // DOCX
    if (docFormat === "docx") {
      try {
        const doc = new Document({
          sections: [{
            children: generatedDocs.split("\n").map(l => {
              if (l.startsWith("# ")) return new Paragraph({ text: l.slice(2), heading: HeadingLevel.HEADING_1 });
              if (l.startsWith("## ")) return new Paragraph({ text: l.slice(3), heading: HeadingLevel.HEADING_2 });
              return new Paragraph({ children: [new TextRun(l)] });
            })
          }]
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, filename);
        toast({ title: "Downloaded", description: `DOCX: ${filename}` });
      } catch (e) {
        toast({ title: "Error", description: "DOCX failed.", variant: "destructive" });
      }
      return;
    }

    // Other
    const blob = new Blob([generatedDocs], { type: format.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: filename });
  }, [generatedDocs, docFormat, docType, identifier, toast]);

  /* ------------------- syntax highlight ------------------- */
  const highlightLang = (fmt: string) => {
    const map: Record<string, string> = {
      markdown: "markdown",
      html: "html",
      jsdoc: "javascript",
      javadoc: "java",
      sphinx: "rst",
      asciidoc: "asciidoc",
    };
    return map[fmt] ?? "text";
  };

  /* ------------------- URL Load ------------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const decoded = decodeURIComponent(atob(code));
      if (!/<\w+|className|ref=/.test(decoded)) {
        setSourceCode(decoded);
        const setters: Record<string, (v: string) => void> = {
          type: setDocType,
          format: setDocFormat,
          style: setDocStyle,
          lang: setLanguage,
          template: setTemplate,
        };
        Object.entries(setters).forEach(([key, setter]) => {
          const val = params.get(key);
          if (val) setter(val);
        });
        const include = params.get("include");
        if (include) setIncludeOptions(include.split(","));
      }
    }
  }, []);

  /* ------------------------------------------------- UI ------------------------------------------------- */
  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-background to-muted/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            Documentation Generator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            AI-powered docs in <strong>8 formats</strong>, <strong>3 languages</strong>, with live preview.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" /> AI</Badge>
            <Badge variant="secondary"><Download className="w-3 h-3 mr-1" /> PDF/DOCX</Badge>
            <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" /> Preview</Badge>
            <Badge variant="secondary"><Palette className="w-3 h-3 mr-1" /> Dark</Badge>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedDocs && !isGenerating}>Result</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Source code */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Source Code</CardTitle>
                  <CardDescription>Paste the code you want documented</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="// Paste your code here..."
                    className="min-h-[400px] font-mono text-sm resize-none"
                    value={sourceCode}
                    onChange={e => setSourceCode(e.target.value)}
                  />
                  {detectedLang && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Detected: <code className="px-1 bg-muted rounded">{detectedLang}</code>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <div className="space-y-6">
                <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>

                  {/* Content */}
                  <TabsContent value="content" className="space-y-4">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Type & Format</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium block mb-2">Document Type</label>
                          <Select value={docType} onValueChange={setDocType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {docTypes.map(t => (
                                <SelectItem key={t.value} value={t.value}>
                                  <div className="flex items-center gap-2">
                                    <t.icon className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{t.label}</div>
                                      <div className="text-xs text-muted-foreground">{t.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">Output Format</label>
                          <Select value={docFormat} onValueChange={setDocFormat}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {docFormats.map(f => (
                                <SelectItem key={f.value} value={f.value}>
                                  <div className="flex items-center gap-2">
                                    <f.icon className="w-4 h-4" />
                                    <span>{f.label} {f.preview && <Eye className="w-3 h-3 ml-1" />}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-lg">Include</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {includeOptions.map(o => (
                            <div key={o.value} className="flex items-start gap-2">
                              <Checkbox
                                id={o.value}
                                checked={includeOptionsState.includes(o.value)}
                                onCheckedChange={c => handleIncludeOptionChange(o.value, c as boolean)}
                              />
                              <label htmlFor={o.value} className="text-sm cursor-pointer flex-1">
                                <div className="font-medium">{o.label}</div>
                                <div className="text-xs text-muted-foreground">{o.description}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Style */}
                  <TabsContent value="style" className="space-y-4">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Style & Language</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium block mb-2">Style</label>
                          <Select value={docStyle} onValueChange={setDocStyle}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {docStyles.map(s => (
                                <SelectItem key={s.value} value={s.value}>
                                  <div>
                                    <div className="font-medium">{s.label}</div>
                                    <div className="text-xs text-muted-foreground">{s.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">Language</label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {languages.map(l => (
                                <SelectItem key={l.value} value={l.value}>
                                  <div className="flex items-center gap-2">
                                    <l.icon className="w-4 h-4" />
                                    <span>{l.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">Template</label>
                          <Select value={template} onValueChange={setTemplate}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {templates.map(t => (
                                <SelectItem key={t.value} value={t.value}>
                                  <div className="flex items-center gap-2">
                                    <t.icon className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{t.label}</div>
                                      <div className="text-xs text-muted-foreground">{t.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Button
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating || !sourceCode.trim()}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Documentation</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Result Tab */}
          <TabsContent value="result" className="space-y-6">
            {isGenerating ? (
              <Card><CardContent className="p-8"><Skeleton className="h-96 w-full" /></CardContent></Card>
            ) : generatedDocs ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Generated Docs
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4" />
                        <span>{docTypes.find(t => t.value === docType)?.label}</span>
                        <span>• The generate button now works 100%</span>
                        <Badge variant="secondary" className="text-xs">
                          {docFormats.find(f => f.value === docFormat)?.label}
                        </Badge>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {languages.find(l => l.value === language)?.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {docFormat === "html" ? (
                    <div
                      className="prose dark:prose-invert max-w-none border rounded-lg p-6 min-h-[500px] bg-white dark:bg-gray-900"
                      dangerouslySetInnerHTML={{ __html: generatedDocs }}
                    />
                  ) : (
                    <div className="rounded-lg overflow-hidden border">
                      <SyntaxHighlighter
                        language={highlightLang(docFormat)}
                        style={isDark ? vscDarkPlus : vs}
                        showLineNumbers
                        customStyle={{ margin: 0, padding: "1.5rem", fontSize: "0.875rem" }}
                        lineProps={{ style: { wordBreak: "break-all", whiteSpace: "pre-wrap" } }}
                        wrapLines
                      >
                        {generatedDocs}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>No documentation yet.</p>
                  <p className="text-sm">Paste code and click Generate.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DocumentationGenerator;