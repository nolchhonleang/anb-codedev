/* src/pages/CodeRunner.tsx */
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Download,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Terminal,
  Globe,
  Loader2,
  FolderOpen,
  Save,
  X,
  ChevronDown,
  RotateCcw,
  Menu,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { executeWithGroq } from "@/lib/groq";
import { AIService } from "@/services/AIService";
import Editor from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* -------------------------------------------------
   TYPES
------------------------------------------------- */
interface Lang {
  id: string;
  name: string;
  monaco: string;
  runtime: "browser" | "backend";
  icon: React.ReactNode;
  defaultCode: string;
  ext: string;
}

interface File {
  id: string;
  name: string;
  content: string;
  langId: string;
}

/* -------------------------------------------------
   LANGUAGES
------------------------------------------------- */
const languages: Lang[] = [
  {
    id: "html",
    name: "HTML",
    monaco: "html",
    runtime: "browser",
    icon: <FileText className="w-4 h-4" />,
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeRunner</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>CodeRunner</h1>
    <p>Edit & run any code instantly!</p>
    <button id="run">Run Code</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    ext: "html",
  },
  {
    id: "css",
    name: "CSS",
    monaco: "css",
    runtime: "browser",
    icon: <FileText className="w-4 h-4" />,
    defaultCode: `* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: system-ui, sans-serif; background: #0f0f23; color: #fff; padding: 1rem; }
.container { text-align: center; padding: 2rem; background: rgba(255,255,255,.05); border-radius: 1.5rem; max-width: 500px; margin: 0 auto; }
h1 { font-size: 2.5rem; background: linear-gradient(90deg,#00ff88,#00d1ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
#run { padding: .8rem 2rem; background: #00ff88; color: #000; border: none; border-radius: 1rem; font-weight: bold; cursor: pointer; }`,
    ext: "css",
  },
  {
    id: "javascript",
    name: "JavaScript",
    monaco: "javascript",
    runtime: "browser",
    icon: <FileText className="w-4 h-4" />,
    defaultCode: `console.log('Ready!');
document.getElementById('run')?.addEventListener('click', () => {
  alert('CodeRunner Pro!');
});`,
    ext: "js",
  },
  {
    id: "python",
    name: "Python",
    monaco: "python",
    runtime: "backend",
    icon: <Terminal className="w-4 h-4" />,
    defaultCode: `print("Hello from Python!")
for i in range(5):
    print(f"→ {i}")`,
    ext: "py",
  },
  { id: "cpp", name: "C++", monaco: "cpp", runtime: "backend", icon: <FileText className="w-4 h-4" />, defaultCode: `#include <iostream>
int main() { std::cout << "C++ running!\\n"; return 0; }`, ext: "cpp" },
  { id: "go", name: "Go", monaco: "go", runtime: "backend", icon: <FileText className="w-4 h-4" />, defaultCode: `package main
import "fmt"
func main() { fmt.Println("Go!") }`, ext: "go" },
  { id: "rust", name: "Rust", monaco: "rust", runtime: "backend", icon: <FileText className="w-4 h-4" />, defaultCode: `fn main() { println!("Rust!"); }`, ext: "rs" },
  { id: "java", name: "Java", monaco: "java", runtime: "backend", icon: <FileText className="w-4 h-4" />, defaultCode: `public class Main {
  public static void main(String[] args) {
    System.out.println("Java!");
  }
}`, ext: "java" },
  { id: "php", name: "PHP", monaco: "php", runtime: "backend", icon: <FileText className="w-4 h-4" />, defaultCode: `<?php echo "PHP works!\\n"; ?>`, ext: "php" },
];

/* -------------------------------------------------
   DEFAULT FILES
------------------------------------------------- */
const defaultFiles: File[] = [
  { id: "1", name: "index.html", content: languages[0].defaultCode, langId: "html" },
  { id: "2", name: "style.css", content: languages[1].defaultCode, langId: "css" },
  { id: "3", name: "script.js", content: languages[2].defaultCode, langId: "javascript" },
];

/* -------------------------------------------------
   HOOK: useIsMobile
------------------------------------------------- */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

/* -------------------------------------------------
   MAIN COMPONENT
------------------------------------------------- */
export default function CodeRunner() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [files, setFiles] = useState<File[]>(defaultFiles);
  const [activeId, setActiveId] = useState("1");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [selectedLangId, setSelectedLangId] = useState(languages[0].id);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<any>(null);
  const runTimeout = useRef<NodeJS.Timeout>();

  const activeFile = files.find(f => f.id === activeId);
  const lang = activeFile ? languages.find(l => l.id === activeFile.langId) : null;
  const hasHtml = files.some(f => f.name === "index.html" && f.langId === "html");
  const isWeb = hasHtml && lang?.runtime === "browser";

  /* ---------- IFRAME READY ---------- */
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handler = () => setIframeReady(true);
    iframe.addEventListener("load", handler);
    return () => iframe.removeEventListener("load", handler);
  }, []);

  /* ---------- CONSOLE CAPTURE ---------- */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "console") {
        setOutput(o => o + e.data.data + "\n");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  /* ---------- AUTO SAVE ---------- */
  useEffect(() => {
    if (!user || !activeFile) return;
    const timer = setTimeout(async () => {
      try {
        await supabase.from("code_executions").upsert({
          user_id: user.id,
          language: activeFile.langId,
          code: activeFile.content,
          output,
          created_at: new Date().toISOString(),
        });
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 1500);
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeFile?.content, output, user]);

  /* ---------- FILE OPERATIONS ---------- */
  const addFile = () => {
    const name = newFileName.trim();
    if (!name) return toast({ title: "File name required", variant: "destructive" });
    if (files.some(f => f.name === name)) return toast({ title: "File exists", variant: "destructive" });

    const l = languages.find(l => l.id === selectedLangId)!;
    const fullName = name.endsWith(`.${l.ext}`) ? name : `${name}.${l.ext}`;
    const newFile: File = {
      id: Date.now().toString(),
      name: fullName,
      content: l.defaultCode,
      langId: selectedLangId,
    };

    setFiles(p => [...p, newFile]);
    setActiveId(newFile.id);
    setDialogOpen(false);
    setNewFileName("");
    toast({ title: "File created", description: fullName });
  };

  const updateFile = (id: string, content: string) => {
    setFiles(p => p.map(f => (f.id === id ? { ...f, content } : f)));
  };

  const deleteFile = (id: string) => {
    setFiles(p => {
      const filtered = p.filter(f => f.id !== id);
      if (activeId === id && filtered.length) setActiveId(filtered[0].id);
      return filtered;
    });
    toast({ title: "File deleted" });
  };

  /* ---------- RUN BROWSER ---------- */
  const runBrowser = useCallback(() => {
    if (!iframeReady || !hasHtml || !iframeRef.current) return;
    setRunning(true);
    setOutput("");

    const htmlFile = files.find(f => f.name === "index.html");
    const css = files.find(f => f.langId === "css")?.content ?? "";
    const js = files.find(f => f.langId === "javascript")?.content ?? "";

    let final = htmlFile?.content ?? "<h1>No index.html</h1>";

    const headIdx = final.indexOf("</head>");
    if (headIdx !== -1 && css) {
      final = final.slice(0, headIdx) + `<style>${css}</style>` + final.slice(headIdx);
    }

    const bodyIdx = final.indexOf("</body>");
    if (bodyIdx !== -1) {
      const consoleScript = `
        <script>
          (function(){
            const orig = console.log;
            console.log = (...args) => {
              orig.apply(console, args);
              window.parent.postMessage({type:'console', data: args.map(a=>String(a)).join(' ')}, '*');
            };
          })();
        </script>`;
      final = final.slice(0, bodyIdx) + consoleScript + (js ? `<script>${js}</script>` : "") + final.slice(bodyIdx);
    }

    const doc = iframeRef.current.contentDocument!;
    doc.open();
    doc.write(final);
    doc.close();

    setOutput("Preview updated");
    setRunning(false);
  }, [files, iframeReady, hasHtml]);

  /* ---------- RUN BACKEND ---------- */
  const runBackend = useCallback(async () => {
    if (!activeFile || !lang) return;
    setRunning(true);
    setOutput("Running…");

    try {
      const res = await executeWithGroq(
        [
          { role: "system", content: `Run this ${lang.name} code and return ONLY stdout/stderr.` },
          { role: "user", content: activeFile.content },
        ],
        { temperature: 0, maxTokens: 4000 }
      );
      setOutput(res.trim() || "No output");
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
      toast({ title: "Run failed", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }, [activeFile, lang, toast]);

  const handleRun = useCallback(() => {
    isWeb ? runBrowser() : runBackend();
  }, [isWeb, runBrowser, runBackend]);

  /* ---------- LIVE PREVIEW (Debounced) ---------- */
  useEffect(() => {
    if (!isWeb || !iframeReady) return;
    if (runTimeout.current) clearTimeout(runTimeout.current);
    runTimeout.current = setTimeout(runBrowser, 300);
    return () => clearTimeout(runTimeout.current);
  }, [files, isWeb, iframeReady, runBrowser]);

  /* ---------- AI EXPLAIN ---------- */
  const explain = useCallback(async () => {
    if (!activeFile) return;
    setExplaining(true);
    setOutput("Generating explanation…");
    try {
      const res = await AIService.chatCompletion([
        { role: "system", content: "Explain this code clearly in 3-5 sentences." },
        { role: "user", content: activeFile.content },
      ]);
      setOutput(`Explanation:\n\n${res}`);
    } catch {
      setOutput("Failed to explain code.");
      toast({ title: "Explain failed", variant: "destructive" });
    } finally {
      setExplaining(false);
    }
  }, [activeFile, toast]);

  /* ---------- KEYBOARD SHORTCUTS ---------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleRun]);

  /* ---------- DOWNLOAD PROJECT ---------- */
  const downloadProject = async () => {
    const zip = new JSZip();
    files.forEach(f => zip.file(f.name, f.content));
    zip.file("README.md", `# CodeRunner Project\n\nRun with any browser.\n\nFiles: ${files.map(f => f.name).join(", ")}`);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `coderunner-${format(new Date(), "yyMMdd-HHmm")}.zip`);
    toast({ title: "Downloaded!" });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* HEADER */}
      <header className="flex items-center justify-between h-14 px-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">CodeRunner</h1>
          <Badge variant="secondary" className="text-xs">{files.length}</Badge>
          {autoSaved && (
            <Badge variant="outline" className="text-xs flex items-center gap-1 animate-pulse">
              <Save className="w-3 h-3" /> Saved
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button size="icon" variant="ghost" onClick={explain} disabled={explaining} aria-label="Explain code">
                {explaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={runBrowser} aria-label="Restart preview">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={downloadProject} aria-label="Download project">
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            onClick={handleRun}
            disabled={running}
            className={cn("font-bold", isMobile ? "px-6 h-10 text-base" : "px-5 h-9 text-sm")}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            RUN
          </Button>
        </div>
      </header>

      {/* FILE TABS */}
      {isMobile ? (
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                {activeFile?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-60 overflow-auto">
              {files.map(f => {
                const l = languages.find(x => x.id === f.langId)!;
                return (
                  <DropdownMenuItem key={f.id} onSelect={() => setActiveId(f.id)} className="flex items-center gap-2">
                    {l.icon} {f.name}
                    <X className="w-3 h-3 ml-auto" onClick={e => { e.stopPropagation(); deleteFile(f.id); }} />
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex overflow-x-auto border-b bg-muted/5">
          {files.map(f => {
            const l = languages.find(x => x.id === f.langId)!;
            return (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-r transition-colors whitespace-nowrap",
                  activeId === f.id
                    ? "bg-background text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.icon} {f.name}
                <X
                  className="w-3 h-3 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={e => {
                    e.stopPropagation();
                    deleteFile(f.id);
                  }}
                />
              </button>
            );
          })}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* EDITOR + OUTPUT */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={lang?.monaco ?? "plaintext"}
              value={activeFile?.content ?? ""}
              onChange={v => activeFile && updateFile(activeFile.id, v ?? "")}
              onMount={editor => editorRef.current = editor}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 8, bottom: 8 },
                cursorBlinking: "smooth",
              }}
            />
          </div>

          <div className="flex-1 min-h-64 border-t bg-muted/5">
            {isWeb ? (
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
              />
            ) : (
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap h-full overflow-auto">
                {output || "Output will appear here..."}
              </pre>
            )}
          </div>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={60} minSize={30}>
            <Editor
              height="100%"
              language={lang?.monaco ?? "plaintext"}
              value={activeFile?.content ?? ""}
              onChange={v => activeFile && updateFile(activeFile.id, v ?? "")}
              onMount={editor => { editorRef.current = editor; setTimeout(() => editor.focus(), 100); }}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                folding: true,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
                cursorBlinking: "smooth",
              }}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={20}>
            <Tabs defaultValue={isWeb ? "preview" : "output"} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="output">
                  <Terminal className="w-4 h-4 mr-1" /> Console
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={!isWeb}>
                  <Globe className="w-4 h-4 mr-1" /> Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="output" className="flex-1 m-0 p-3 overflow-auto bg-muted/5">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {output || "Output appears here…"}
                </pre>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  title="Live Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* NEW FILE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="main.py"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addFile()}
              autoFocus
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {languages.find(l => l.id === selectedLangId)?.name} <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-auto">
                {languages.map(l => (
                  <DropdownMenuItem key={l.id} onSelect={() => setSelectedLangId(l.id)}>
                    {l.icon} {l.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}