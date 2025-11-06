import { GroqService } from './groqService';

type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class AIService {
  // Centralized method for all chat completions
  // Language detection using AI
  static async detectLanguage(code: string): Promise<string> {
    const systemPrompt = `You are a programming language detection system. Analyze the code and respond with only the programming language name in lowercase.`;
    const prompt = `What programming language is this code written in? Respond with only the language name in lowercase.

\`\`\`
${code.substring(0, 1000)} // Only using first 1000 chars for detection
\`\`\``;

    try {
      const result = await GroqService.executeWithGroq(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        { temperature: 0.1, maxTokens: 20 }
      );
      
      // Clean up the response to get just the language name
      return result.trim().toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'unknown';
    }
  }

  static async chatCompletion(messages: AIMessage[], options: {
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<string> {
    return GroqService.executeWithGroq(messages, {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2000,
    });
  }

  // Code Generation
  static async generateCode(description: string, language: string): Promise<string> {
    return GroqService.generateCode(description, language);
  }

  // Code Optimization
  static async optimizeCode(code: string, language: string): Promise<{
    optimizedCode: string;
    analysis: string;
  }> {
    const systemPrompt = `You are a senior ${language} developer specializing in code optimization.`;
    const prompt = `Optimize the following ${language} code for better performance, readability, and maintainability. 
    Include a brief analysis of the optimizations made.

    Code to optimize:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Return a JSON object with two fields: 'optimizedCode' and 'analysis'`;

    const result = await this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse optimization result:', e);
      return {
        optimizedCode: code,
        analysis: 'Failed to optimize code. Please try again.'
      };
    }
  }

  // Code Conversion
  static async convertCode(
    code: string, 
    fromLanguage: string, 
    toLanguage: string
  ): Promise<string> {
    const systemPrompt = `You are an expert in multiple programming languages. Convert the following code from ${fromLanguage} to ${toLanguage} accurately.`;
    const prompt = `Convert this ${fromLanguage} code to ${toLanguage}:
    \`\`\`${fromLanguage}
    ${code}
    \`\`\``;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.2 });
  }

  // Debug and Refactor
  static async debugAndRefactor(
    code: string, 
    language: string, 
    issues: string[] = []
  ): Promise<{
    fixedCode: string;
    issuesFound: string[];
    suggestions: string;
  }> {
    const systemPrompt = `You are a senior ${language} developer. Analyze the code for bugs, potential issues, and refactoring opportunities.`;
    
    let prompt = `Analyze and improve the following ${language} code`;
    if (issues.length > 0) {
      prompt += ` with a focus on: ${issues.join(', ')}`;
    }
    prompt += `:\n\`\`\`${language}\n${code}\n\`\`\``;

    const result = await this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse debug result:', e);
      return {
        fixedCode: code,
        issuesFound: ['Failed to analyze code'],
        suggestions: 'Please try again or provide more specific issues to look for.'
      };
    }
  }

  // Security Audit
  static async securityAudit(
    code: string, 
    language: string,
    vulnerabilityTypes: string[] = []
  ): Promise<{
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line: number;
      fix: string;
    }>;
    score: number;
    summary: string;
  }> {
    const systemPrompt = `You are a security expert. Analyze the following ${language} code for security vulnerabilities.`;
    
    let prompt = `Perform a security audit on this ${language} code`;
    if (vulnerabilityTypes.length > 0) {
      prompt += ` with focus on: ${vulnerabilityTypes.join(', ')}`;
    }
    prompt += `:\n\`\`\`${language}\n${code}\n\`\`\``;

    const result = await this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.2 });

    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse security audit result:', e);
      return {
        issues: [],
        score: 0,
        summary: 'Failed to perform security audit. Please try again.'
      };
    }
  }

  // Documentation Generation
  static async generateDocumentation(
    code: string, 
    language: string,
    docType: 'inline' | 'jsdoc' | 'readme' | 'api' = 'jsdoc'
  ): Promise<string> {
    const systemPrompt = `You are a technical writer and ${language} expert. Generate ${docType} documentation for the provided code.`;
    
    const prompt = `Generate ${docType} documentation for this ${language} code:
    \`\`\`${language}
    ${code}
    \`\`\``;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });
  }

  // Test Generation
  static async generateTests(
    code: string, 
    language: string,
    testFramework?: string
  ): Promise<string> {
    const framework = testFramework || 
      (language === 'javascript' ? 'Jest' : 
       language === 'python' ? 'pytest' : 
       language === 'java' ? 'JUnit' : 'the appropriate testing framework');
    
    const systemPrompt = `You are a QA engineer. Write comprehensive tests for the provided ${language} code using ${framework}.`;
    
    const prompt = `Write unit tests for this ${language} code using ${framework}:
    \`\`\`${language}
    ${code}
    \`\`\``;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });
  }

  // Code Explanation
  static async explainCode(
    code: string,
    language: string,
    detailLevel: 'brief' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<string> {
    const systemPrompt = `You are a ${language} expert. Explain the following code in a clear, concise way using plain text only.`;
    
    const prompt = `Explain this ${language} code in ${detailLevel} detail, using only plain text format.
    
    RULES FOR YOUR RESPONSE:
    1. Use only plain text - NO markdown, backticks, asterisks, or any special formatting
    2. Do not use headers, sections, or any kind of dividers
    3. Do not show the code being explained
    4. Write in complete sentences with proper punctuation
    5. Use line breaks between paragraphs for better readability
    6. Do not use any special characters for emphasis
    
    Code to explain:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Provide a clear, flowing explanation as if you were explaining it to a colleague in person.`;

    const explanation = await this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { 
      temperature: 0.3,
      maxTokens: 1000
    });

    // Clean up any remaining special characters or formatting
    return explanation
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove any remaining markdown or special characters
      .replace(/[#*_`~]/g, '')
      // Remove any remaining HTML tags if present
      .replace(/<[^>]*>?/gm, '')
      // Clean up whitespace
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
