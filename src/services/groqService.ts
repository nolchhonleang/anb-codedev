// This service now proxies requests to a server-side Supabase function
// which holds the GROQ secret. That avoids exposing the API key in
// client-side bundles. The function we create is `groq-proxy` and is
// expected to be available at `${VITE_SUPABASE_URL}/functions/v1/groq-proxy`.
//
// Keep the same default model here for consistency with previous behavior.
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
};

export class GroqService {
  static async executeWithGroq(
    messages: GroqMessage[],
    options: GroqOptions = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 4000,
      topP = 1,
      stream = false,
    } = options;

    try {
      // Build the proxy URL using the Vite environment variable for Supabase
      // The Supabase Functions endpoint follows: <SUPABASE_URL>/functions/v1/<name>
      const functionsBase = import.meta.env.VITE_SUPABASE_URL || '';
      const proxyUrl = `${functionsBase.replace(/\/$/, '')}/functions/v1/groq-proxy`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stream,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const errJson = JSON.parse(text);
          throw new Error(errJson.error || errJson.message || `Groq proxy error: ${response.status}`);
        } catch (e) {
          throw new Error(`Groq proxy error: ${response.status} - ${text}`);
        }
      }

      const data = await response.json();
      // The proxy returns { response: string } to mirror other functions like ai-chat
      return data.response ?? data.generatedCode ?? data.content ?? '';
    } catch (error) {
      console.error('Groq proxy Error:', error);
      throw error;
    }
  }

  static async generateCode(description: string, language: string): Promise<string> {
    const systemPrompt = `You are a senior ${language} developer. Your task is to transform natural language requirements into production-ready code.

IMPORTANT INSTRUCTIONS:
1. Generate ONLY the complete, runnable code
2. DO NOT include any markdown code blocks
3. DO NOT include any explanatory text or comments
4. DO NOT include any placeholders or TODOs
5. The first line of your response must be valid code
6. Include all necessary imports and exports
7. Ensure the code is properly formatted
8. Add appropriate error handling
9. Use modern ${language} features and best practices`;
    
    const prompt = `Generate production-ready ${language} code based on this description: "${description}"

REQUIREMENTS:
1. Generate ONLY the code - no explanations, no markdown, no placeholders
2. The code must be immediately runnable
3. Include all necessary imports and dependencies
4. Add proper error handling
5. Consider edge cases
6. Follow best practices for ${language}
7. The first line must be valid code (no comments or markdown)

IMPORTANT: Your response must be the raw code only, with no additional text before or after.`;

    try {
      // Make the API call with a lower temperature for more focused results
      const result = await this.executeWithGroq([
        { 
          role: 'system', 
          content: systemPrompt 
        },
        { 
          role: 'user', 
          content: prompt
        }
      ], {
        temperature: 0.3,  // Lower temperature for more focused output
        maxTokens: 4000    // Increased token limit for longer code
      });
      
      // Clean up the response to ensure it's just the code
      return this.cleanCodeResponse(result, language);
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code. Please try again with a more specific prompt.');
    }
  }

  private static cleanCodeResponse(code: string, language: string): string {
    // Remove markdown code blocks and extract content
    let cleaned = code.replace(/^```(?:\w+)?\n([\s\S]*?)\n```$/gm, '$1').trim();
    
    // Remove any remaining markdown formatting
    cleaned = cleaned.replace(/`/g, '');
    
    // Remove common AI disclaimers and template comments
    const patternsToRemove = [
      // Common AI disclaimers
      /^\/\*[\s\S]*?\*\/\s*\n?/gm, // Block comments
      /^\/\/.*(?:generated|example|template|todo|note:|note that|please|change this|implement|TODO:|FIXME:).*\n?/gmi,
      /^#!\/.*\n?/g, // Shebang lines
      // Common template patterns
      /^\/\*[\s\S]*?replace this.*?\*\/\s*\n?/gmi,
      /^\/\/\s*(?:TODO|FIXME|NOTE|HACK|XXX).*\n?/gmi,
      /^\/\/\s*Your code here.*\n?/gmi,
      /^\/\/\s*Add your .* here.*\n?/gmi,
      /^\/\/\s*Implement .*\n?/gmi,
      // Common AI intros
      /^(?:Here'?s|Here is|Here are).*?:\n\n?/i,
      /^The following .*?:\n\n?/i,
      /^To get started.*?:\n\n?/i,
      // Empty lines at start
      /^\s*\n+/
    ];

    patternsToRemove.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Remove any remaining single-line comments that are alone on their line
    cleaned = cleaned.replace(/^\s*\/\/.*\n?/gm, '');

    // Remove multiple consecutive empty lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Remove trailing whitespace and ensure the code ends with a single newline
    return cleaned.trim() + '\n';
  }

  static async generateTests(code: string, language: string): Promise<string> {
    const systemPrompt = `You are a QA engineer. Generate comprehensive test cases for the following ${language} code. Include edge cases and error handling.`;
    
    const result = await this.executeWithGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ]);
    
    return this.cleanCodeResponse(result, language);
  }

  static async explainCode(code: string, language: string): Promise<string> {
    const systemPrompt = `You are a senior developer. Explain the following ${language} code in detail, including its purpose, how it works, and any important considerations.`;
    
    const result = await this.executeWithGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ]);
    
    return result;
  }

  static async debugCode(code: string, language: string, error?: string): Promise<string> {
    const systemPrompt = `You are a debugging expert. Analyze and fix issues in the following ${language} code. ${error ? `The following error occurred: ${error}` : ''}`;
    
    return this.executeWithGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ]);
  }

  static async generateDocumentation(code: string, language: string): Promise<string> {
    const systemPrompt = `Generate professional documentation for the following ${language} code. Include:
    1. Function/Class purpose
    2. Parameters and return values
    3. Examples of usage
    4. Any important notes or warnings`;
    
    return this.executeWithGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ]);
  }

  static async optimizeCode(code: string, language: string): Promise<string> {
    const systemPrompt = `You are a performance optimization expert. Analyze and optimize the following ${language} code for better performance, readability, and maintainability.`;
    
    return this.executeWithGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ]);
  }

  static async auditSecurity(code: string, language: string): Promise<string> {
    const systemPrompt = `You are a security expert. Perform a security audit of the following ${language} code. Identify and explain any potential security vulnerabilities.`;
    
    return this.executeWithGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: code }
    ]);
  }
}
