import { GroqService } from "@/services/groqService";
import { StandardizedOutput } from "./apiResponseHandler";

export interface AIApiCallOptions {
  functionName: string;
  body: any;
  fallbackContent: string;
  handlerType: 'code-generation' | 'test-generation' | 'code-explanation' | 'debug-refactor' | 'code-optimization' | 'documentation' | 'security-audit';
}

export class AIApiCaller {
  
  static async callAIFunction(options: AIApiCallOptions): Promise<StandardizedOutput> {
    const { functionName, body, fallbackContent, handlerType } = options;
    
    try {
      let result: string;
      const language = body.language || 'javascript'; // Default to javascript if not specified
      
      switch (handlerType) {
        case 'code-generation':
          result = await GroqService.generateCode(body.description || body.sourceCode || '', language);
          break;
          
        case 'test-generation':
          result = await GroqService.generateTests(body.sourceCode || '', language);
          break;
          
        case 'code-explanation':
          result = await GroqService.explainCode(body.sourceCode || '', language);
          break;
          
        case 'debug-refactor':
          result = await GroqService.debugCode(body.sourceCode || '', language, body.error);
          break;
          
        case 'documentation':
          result = await GroqService.generateDocumentation(body.sourceCode || '', language);
          break;
          
        case 'security-audit':
          result = await GroqService.auditSecurity(body.sourceCode || '', language);
          break;
          
        case 'code-optimization':
          result = await GroqService.optimizeCode(body.sourceCode || '', language);
          break;
          
        default:
          throw new Error(`Unsupported handler type: ${handlerType}`);
      }
      
      return {
        content: result,
        isPlaceholder: false,
        metadata: {
          model: 'llama-3.3-70b-versatile',
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error(`Error in ${functionName}:`, error);
      return {
        content: `Error: ${error.message}\n\n${fallbackContent}`,
        isPlaceholder: true,
        metadata: {
          error: true,
          errorMessage: error.message
        }
      };
    }
  }

  // Specialized method for code optimization that returns both code and analysis
  static async callCodeOptimization(
    functionName: string, 
    body: any, 
    fallbackCode: string, 
    fallbackAnalysis: string
  ): Promise<{ optimizedCode: StandardizedOutput; analysisReport: StandardizedOutput }> {
    try {
      const language = body.language || 'javascript';
      const optimizedCode = await GroqService.optimizeCode(body.sourceCode || '', language);
      
      const result: StandardizedOutput = {
        content: optimizedCode,
        isPlaceholder: false,
        metadata: {
          model: 'llama-3.3-70b-versatile',
          timestamp: new Date().toISOString()
        }
      };
      
      return {
        optimizedCode: result,
        analysisReport: {
          content: 'Code optimization analysis is included in the optimized code comments.',
          isPlaceholder: false
        }
      };
      
    } catch (error) {
      console.error('Optimization error:', error);
      return {
        optimizedCode: {
          content: fallbackCode,
          isPlaceholder: true,
          metadata: {
            error: true,
            errorMessage: error.message
          }
        },
        analysisReport: {
          content: fallbackAnalysis,
          isPlaceholder: true,
          metadata: {
            error: true,
            errorMessage: error.message
          }
        }
      };
    }
  }

  // Helper method to generate success messages
  static generateSuccessMessage(result: StandardizedOutput, toolName: string, details?: string): string {
    if (result.isPlaceholder) {
      return `Generated ${toolName.toLowerCase()} (fallback mode).`;
    } else {
      return `AI-powered ${toolName.toLowerCase()} generated successfully using Groq!${details ? ` ${details}` : ''}`;
    }
  }
}
