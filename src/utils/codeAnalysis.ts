/**
 * Code Analysis Utilities
 * Unified language detection and identifier extraction for the A&B CodeDev platform
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  fallback?: boolean;
}

export interface CodeAnalysisConfig {
  useAI?: boolean;
  minConfidence?: number;
  fallbackToText?: boolean;
}

/**
 * Comprehensive language detection with AI and regex fallbacks
 */
export async function detectLanguage(
  code: string,
  config: CodeAnalysisConfig = {}
): Promise<LanguageDetectionResult> {
  const { useAI = true, minConfidence = 0, fallbackToText = true } = config;

  if (!code.trim()) {
    return { language: fallbackToText ? 'text' : 'unknown', confidence: 0 };
  }

  // Try AI detection first if enabled
  if (useAI) {
    try {
      const aiLang = await AIService.detectLanguage(code);
      if (aiLang && aiLang !== "unknown") {
        return { language: aiLang, confidence: 90 };
      }
    } catch (e) {
      console.warn("AI language detection failed, using regex fallback");
    }
  }

  // Advanced regex-based detection with scoring
  const patterns: Array<{ pattern: RegExp; language: string; weight: number }> = [
    // High-confidence patterns (weight: 3)
    { pattern: /export\s+default|type\s+\w+\s*=|interface\s+\w+|enum\s+\w+/g, language: 'typescript', weight: 3 },
    { pattern: /\b(Console\.WriteLine|using\s+System;|namespace\s+\w+)/g, language: 'csharp', weight: 3 },
    { pattern: /\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE)\s+/gi, language: 'sql', weight: 3 },
    { pattern: /import\s+React|React\.|useState|useEffect|JSX\.Element/g, language: 'tsx', weight: 3 },
    { pattern: /from\s+['"]react['"]|ReactDOM\.|useState|useEffect/g, language: 'jsx', weight: 3 },

    // Medium-confidence patterns (weight: 2)
    { pattern: /(const|let|var)\s+\w+\s*=[^=]|function\s+\w+\s*\(|=>|import\s+[\w{ ]/g, language: 'javascript', weight: 2 },
    { pattern: /^\s*(def|class)\s+\w+\s*[(:]|^\s*import\s+\w+|^\s*from\s+\w+/gm, language: 'python', weight: 2 },
    { pattern: /\b(public|private|protected)\s+\w+\s+\w+\s*\{|class\s+\w+/g, language: 'java', weight: 2 },
    { pattern: /#include\s+[<"][\w./]+[>"]|using\s+namespace|std::/g, language: 'cpp', weight: 2 },
    { pattern: /\bfunc\s+\w+\s*\(|package\s+main|import\s+\(/g, language: 'go', weight: 2 },
    { pattern: /<\?php|\$\w+\s*=|\$_\w+/g, language: 'php', weight: 2 },
    { pattern: /[.#]\w+\s*\{[^}]*\}|@(media|keyframes|import)/g, language: 'css', weight: 2 },
    { pattern: /\bfn\s+\w+\s*\(|let\s+mut|println!/g, language: 'rust', weight: 2 },
    { pattern: /\bfun\s+\w+\s*\(|val\s+\w+\s*[:=]|var\s+\w+\s*[:=]/g, language: 'kotlin', weight: 2 },
    { pattern: /func\s+\w+\s*\(|defer\s+\w+|goroutine/g, language: 'go', weight: 2 },
    { pattern: /public\s+static\s+void\s+main|String\[\]\s+args/g, language: 'java', weight: 2 },

    // Low-confidence patterns (weight: 1)
    { pattern: /<\w+[^>]*>.*<\/\w+>|<\/\w+>/gi, language: 'html', weight: 1 },
    { pattern: /<!DOCTYPE\s+html>/i, language: 'html', weight: 2 },
    { pattern: /def\s+\w+\s*\(/, language: 'python', weight: 1 },
    { pattern: /function\s+\w+\s*\(/, language: 'javascript', weight: 1 },
    { pattern: /class\s+\w+/, language: 'java', weight: 1 },
  ];

  const scores: Record<string, number> = {};
  patterns.forEach(({ pattern, language, weight }) => {
    const matches = (code.match(pattern) || []).length;
    if (matches) {
      scores[language] = (scores[language] || 0) + matches * weight;
    }
  });

  // Find the language with highest score
  const [bestLanguage = 'unknown', score = 0] = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0] || [];

  // Calculate confidence based on score and code length
  const confidence = Math.min(100, Math.round((score / (code.length * 0.01)) * 100));

  // Use fallback if confidence is too low
  if (confidence < minConfidence) {
    return {
      language: fallbackToText ? 'text' : 'unknown',
      confidence: 0,
      fallback: true
    };
  }

  return { language: bestLanguage, confidence };
}

/**
 * Extract function/class/variable identifier from code
 */
export function extractIdentifier(code: string, language?: string): string {
  // Language-specific patterns for better accuracy
  const languagePatterns: Record<string, RegExp[]> = {
    javascript: [
      /(?:function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]/,
      /(?:export\s+)?(?:function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
    ],
    typescript: [
      /(?:function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]/,
      /(?:export\s+)?(?:function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
      /interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
      /type\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/,
    ],
    python: [
      /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      /class\s+([A-Za-z_][A-Za-z0-9_]*)/,
    ],
    java: [
      /(?:public\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
      /(?:public\s+)?(?:interface|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    ],
    csharp: [
      /(?:public\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
      /(?:public\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    ],
    cpp: [
      /class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
      /struct\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    ],
    php: [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
      /class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    ],
    ruby: [
      /def\s+([a-zA-Z_][a-zA-Z0-9_?!]*)/,
      /class\s+([A-Za-z_][A-Za-z0-9_]*)/,
    ],
    go: [
      /func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
      /type\s+([A-Za-z_][A-Za-z0-9_]*)\s+/,
    ],
    rust: [
      /fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      /struct\s+([A-Za-z_][A-Za-z0-9_]*)/,
    ],
    kotlin: [
      /fun\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
      /class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    ],
  };

  // Try language-specific patterns first
  if (language && languagePatterns[language]) {
    for (const pattern of languagePatterns[language]) {
      const match = code.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  // Fallback to general patterns
  const generalPatterns = [
    /(?:function|const|let|var|def|class|interface|type|struct)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/, // function-like
    /([A-Za-z_$][A-Za-z0-9_$]*)/, // any identifier
  ];

  for (const pattern of generalPatterns) {
    const match = code.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Final fallback
  return 'code';
}

/**
 * Validate code input for common issues
 */
export function validateCodeInput(code: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!code || !code.trim()) {
    issues.push('Code cannot be empty');
  }

  if (code.length > 100000) {
    issues.push('Code is too long (max 100KB)');
  }

  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      issues.push('Code contains potentially unsafe content');
    }
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get syntax highlighting language for code display
 */
export function getSyntaxHighlightLanguage(language: string): string {
  const mapping: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    python: 'python',
    java: 'java',
    csharp: 'csharp',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby',
    kotlin: 'kotlin',
    swift: 'swift',
    dart: 'dart',
    html: 'html',
    css: 'css',
    sql: 'sql',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    markdown: 'markdown',
  };

  return mapping[language] || 'text';
}

// Import AIService for AI-based detection
import { AIService } from '@/services/aiService';
