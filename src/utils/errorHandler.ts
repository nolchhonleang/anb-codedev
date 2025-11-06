import { toast } from "@/hooks/use-toast";

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): AppError {
    const timestamp = new Date();
    
    // Handle different error types
    if (error instanceof Error) {
      const appError: AppError = {
        code: 'GENERIC_ERROR',
        message: error.message,
        details: context,
        timestamp
      };
      
      // Log error for debugging
      console.error(`[${context || 'Unknown'}] Error:`, error);
      
      return appError;
    }
    
    // Handle Supabase errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const supabaseError = error as { code: string; message: string; details?: string };
      const appError: AppError = {
        code: supabaseError.code,
        message: supabaseError.message,
        details: supabaseError.details || context,
        timestamp
      };
      
      console.error(`[${context || 'Supabase'}] Error:`, supabaseError);
      
      return appError;
    }
    
    // Handle unknown errors
    const appError: AppError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: context,
      timestamp
    };
    
    console.error(`[${context || 'Unknown'}] Unknown error:`, error);
    
    return appError;
  }
  
  static showToast(error: AppError, title?: string) {
    toast({
      title: title || 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
  
  static handleAndShow(error: unknown, context?: string, title?: string) {
    const appError = this.handle(error, context);
    this.showToast(appError, title);
    return appError;
  }
  
  // Specific error handlers
  static handleApiError(error: unknown, operation: string) {
    return this.handleAndShow(error, `API: ${operation}`, 'API Error');
  }
  
  static handleAuthError(error: unknown, operation: string) {
    return this.handleAndShow(error, `Auth: ${operation}`, 'Authentication Error');
  }
  
  static handleValidationError(message: string, field?: string) {
    const error: AppError = {
      code: 'VALIDATION_ERROR',
      message,
      details: field,
      timestamp: new Date()
    };
    
    this.showToast(error, 'Validation Error');
    return error;
  }
}

// Utility functions for common error scenarios
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.handleAndShow(error, context);
      return null;
    }
  };
};

export const validateRequired = (value: string, fieldName: string): boolean => {
  if (!value || value.trim() === '') {
    ErrorHandler.handleValidationError(`${fieldName} is required`, fieldName);
    return false;
  }
  return true;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    ErrorHandler.handleValidationError('Please enter a valid email address', 'email');
    return false;
  }
  return true;
};

export const validateCodeInput = (code: string, language: string): boolean => {
  if (!validateRequired(code, 'Code')) return false;
  
  // Basic validation for code length
  if (code.length > 50000) {
    ErrorHandler.handleValidationError('Code is too long (maximum 50,000 characters)', 'code');
    return false;
  }
  
  return true;
};
