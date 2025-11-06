// Standardized API response handler for all AI tools

export interface AIApiResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  message?: string;
}

export interface StandardizedOutput {
  content: string;
  metadata?: {
    model?: string;
    timestamp?: string;
    tokens?: number;
    processingTime?: number;
    error?: boolean;
    errorMessage?: string;
  };
  isPlaceholder?: boolean;
}

export class ApiResponseHandler {
  
  // Utility function to safely access properties from unknown data
  private static safeGet(data: unknown, key: string): string | number | undefined {
    if (data && typeof data === 'object' && key in data) {
      return (data as Record<string, unknown>)[key] as string | number;
    }
    return undefined;
  }

  // Utility to extract content from API response data
  private static extractContent(data: unknown, contentFields: string[], fallback: string): string {
    if (!data || typeof data !== 'object') return fallback;
    
    const dataObj = data as Record<string, unknown>;
    for (const field of contentFields) {
      const value = dataObj[field];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
    return fallback;
  }

  // Utility to create metadata from API response data
  private static createMetadata(data: unknown) {
    if (!data || typeof data !== 'object') {
      return {
        model: 'Google Gemini 2.5 Flash',
        timestamp: new Date().toISOString()
      };
    }

    const dataObj = data as Record<string, unknown>;
    return {
      model: (dataObj.model as string) || 'Google Gemini 2.5 Flash',
      timestamp: (dataObj.timestamp as string) || new Date().toISOString(),
      tokens: (dataObj.tokens as number) || (dataObj.token_count as number) || undefined,
      processingTime: (dataObj.processing_time as number) || (dataObj.duration as number) || undefined
    };
  }
  
  // Handle Code Generation API response
  static handleCodeGeneration(response: Record<string, unknown> | null, fallbackContent: string): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const content = this.extractContent(
      response.data, 
      ['generatedCode', 'code', 'result', 'output', 'content'], 
      fallbackContent
    );

    return {
      content,
      metadata: this.createMetadata(response.data),
      isPlaceholder: content === fallbackContent
    };
  }

  // Handle Test Generation API response
  static handleTestGeneration(response: Record<string, unknown> | null, fallbackContent: string): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const data = response.data as Record<string, any>;
    
    const content = 
      data.generatedTests || 
      data.tests || 
      data.test_code ||
      data.result || 
      data.output || 
      data.content ||
      fallbackContent;

    return {
      content: String(content),
      metadata: {
        model: String(data.model || 'llama-3.3-70b-versatile'),
        timestamp: String(data.timestamp || new Date().toISOString()),
        tokens: Number(data.tokens || data.token_count || 0) || undefined,
        processingTime: Number(data.processing_time || data.duration || 0) || undefined
      },
      isPlaceholder: String(content) === fallbackContent
    };
  }

  // Handle Code Explanation API response
  static handleCodeExplanation(response: Record<string, unknown> | null, fallbackContent: string): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const data = response.data as Record<string, any>;
    
    const content = 
      data.explanation || 
      data.analysis ||
      data.result || 
      data.output || 
      data.content ||
      fallbackContent;

    return {
      content: String(content),
      metadata: {
        model: String(data.model || 'llama-3.3-70b-versatile'),
        timestamp: String(data.timestamp || new Date().toISOString()),
        tokens: Number(data.tokens || data.token_count || 0) || undefined,
        processingTime: Number(data.processing_time || data.duration || 0) || undefined
      },
      isPlaceholder: String(content) === fallbackContent
    };
  }

  // Handle Debug & Refactor API response
  static handleDebugRefactor(response: Record<string, unknown> | null, fallbackContent: string): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const data = response.data as Record<string, any>;
    
    const content = 
      data.analysis || 
      data.debug_report ||
      data.refactor_suggestions ||
      data.result || 
      data.output || 
      data.content ||
      fallbackContent;

    return {
      content: String(content),
      metadata: {
        model: String(data.model || 'llama-3.3-70b-versatile'),
        timestamp: String(data.timestamp || new Date().toISOString()),
        tokens: Number(data.tokens || data.token_count || 0) || undefined,
        processingTime: Number(data.processing_time || data.duration || 0) || undefined
      },
      isPlaceholder: String(content) === fallbackContent
    };
  }

  // Handle Code Optimization API response
  static handleCodeOptimization(response: Record<string, unknown> | null, fallbackCode: string, fallbackReport: string): {
    optimizedCode: StandardizedOutput;
    analysisReport: StandardizedOutput;
  } {
    if (!response || !response.data) {
      return {
        optimizedCode: {
          content: fallbackCode,
          isPlaceholder: true
        },
        analysisReport: {
          content: fallbackReport,
          isPlaceholder: true
        }
      };
    }

    const data = response.data as Record<string, any>;
    const result = data.result as Record<string, any> || {};
    
    const optimizedCode = 
      data.optimizedCode || 
      data.optimized_code ||
      data.code ||
      result.code ||
      fallbackCode;

    const analysisReport = 
      data.analysisReport || 
      data.analysis_report ||
      data.analysis ||
      data.report ||
      result.analysis ||
      fallbackReport;

    return {
      optimizedCode: {
        content: String(optimizedCode),
        metadata: {
          model: String(data.model || 'llama-3.3-70b-versatile'),
          timestamp: String(data.timestamp || new Date().toISOString()),
          tokens: Number(data.tokens || data.token_count || 0) || undefined,
          processingTime: Number(data.processing_time || data.duration || 0) || undefined
        },
        isPlaceholder: String(optimizedCode) === fallbackCode
      },
      analysisReport: {
        content: String(analysisReport),
        metadata: {
          model: String(data.model || 'llama-3.3-70b-versatile'),
          timestamp: String(data.timestamp || new Date().toISOString())
        },
        isPlaceholder: String(analysisReport) === fallbackReport
      }
    };
  }

  // Handle Documentation Generation API response
  static handleDocumentationGeneration(response: Record<string, unknown> | null, fallbackContent: string): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const data = response.data as Record<string, any>;
    
    const content = 
      data.documentation || 
      data.docs ||
      data.generated_docs ||
      data.result || 
      data.output || 
      data.content ||
      fallbackContent;

    return {
      content: String(content),
      metadata: {
        model: String(data.model || 'llama-3.3-70b-versatile'),
        timestamp: String(data.timestamp || new Date().toISOString()),
        tokens: Number(data.tokens || data.token_count || 0) || undefined,
        processingTime: Number(data.processing_time || data.duration || 0) || undefined
      },
      isPlaceholder: String(content) === fallbackContent
    };
  }

  // Handle Security Audit API response
  static handleSecurityAudit(response: Record<string, unknown> | null, fallbackContent: string): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const data = response.data as Record<string, any>;
    
    const content = 
      data.auditReport || 
      data.audit_report ||
      data.security_report ||
      data.vulnerabilities ||
      data.result || 
      data.output || 
      data.content ||
      fallbackContent;

    return {
      content: String(content),
      metadata: {
        model: String(data.model || 'llama-3.3-70b-versatile'),
        timestamp: String(data.timestamp || new Date().toISOString()),
        tokens: Number(data.tokens || data.token_count || 0) || undefined,
        processingTime: Number(data.processing_time || data.duration || 0) || undefined
      },
      isPlaceholder: String(content) === fallbackContent
    };
  }

  // Generic handler for any AI tool
  static handleGenericResponse(response: Record<string, unknown> | null, fallbackContent: string, expectedFields: string[] = []): StandardizedOutput {
    if (!response || !response.data) {
      return {
        content: fallbackContent,
        isPlaceholder: true
      };
    }

    const data = response.data as Record<string, any>;
    
    // Try expected fields first, then common fields
    let content = fallbackContent;
    
    for (const field of expectedFields) {
      if (data[field]) {
        content = data[field];
        break;
      }
    }
    
    // If no expected field found, try common fields
    if (content === fallbackContent) {
      content = 
        data.result || 
        data.output || 
        data.content ||
        data.response ||
        fallbackContent;
    }

    return {
      content: String(content),
      metadata: {
        model: String(data.model || 'llama-3.3-70b-versatile'),
        timestamp: String(data.timestamp || new Date().toISOString()),
        tokens: Number(data.tokens || data.token_count || 0) || undefined,
        processingTime: Number(data.processing_time || data.duration || 0) || undefined
      },
      isPlaceholder: String(content) === fallbackContent
    };
  }

  // Error handler for API failures
  static handleApiError(error: any): StandardizedOutput {
    const errorMessage = error?.message || error?.details || 'An unexpected error occurred';
    
    return {
      content: `# API Error\n\nAn error occurred while processing your request:\n\n**Error:** ${errorMessage}\n\n**Troubleshooting:**\n- Check your internet connection\n- Verify API configuration\n- Try again in a few moments\n\nIf the problem persists, please contact support.`,
      metadata: {
        timestamp: new Date().toISOString(),
        error: true,
        errorMessage: errorMessage
      },
      isPlaceholder: true
    };
  }
}
