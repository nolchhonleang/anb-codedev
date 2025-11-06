// Performance monitoring utilities for A&B CodeDev

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static metrics: Map<string, number[]> = new Map();

  // Start timing an operation
  static startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  // End timing and record the duration
  static endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      console.warn(`Timer for operation "${operation}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operation);

    // Store metric
    const existing = this.metrics.get(operation) || [];
    existing.push(duration);
    this.metrics.set(operation, existing);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get average duration for an operation
  static getAverageDuration(operation: string): number {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) return 0;

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  // Get all performance metrics
  static getMetrics(): Record<string, { average: number; count: number; total: number }> {
    const result: Record<string, { average: number; count: number; total: number }> = {};

    this.metrics.forEach((durations, operation) => {
      const total = durations.reduce((sum, duration) => sum + duration, 0);
      result[operation] = {
        average: total / durations.length,
        count: durations.length,
        total
      };
    });

    return result;
  }

  // Clear all metrics
  static clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Measure a function execution time
  static async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(operation);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endTimer(operation);
    }
  }

  // Measure synchronous function execution time
  static measureSync<T>(operation: string, fn: () => T): T {
    this.startTimer(operation);
    try {
      const result = fn();
      return result;
    } finally {
      this.endTimer(operation);
    }
  }
}

// Decorator for measuring method performance
export function measurePerformance(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return PerformanceMonitor.measure(operationName, () => method.apply(this, args));
    };
  };
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage(): any | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  static logMemoryUsage(context?: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
      const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100;
      
      console.log(`Memory Usage${context ? ` (${context})` : ''}:`, {
        used: `${used} MB`,
        total: `${total} MB`,
        limit: `${limit} MB`,
        percentage: `${Math.round((used / limit) * 100)}%`
      });
    }
  }

  static isMemoryPressureHigh(): boolean {
    const memory = this.getMemoryUsage();
    if (!memory) return false;
    
    const usagePercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    return usagePercentage > 0.8; // 80% threshold
  }
}

// Bundle size and loading performance
export class LoadingMonitor {
  static measurePageLoad(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnection: navigation.connectEnd - navigation.connectStart,
          serverResponse: navigation.responseEnd - navigation.requestStart,
          domProcessing: navigation.domComplete - navigation.domInteractive
        };

        console.log('Page Load Metrics:', metrics);
        
        // Log slow loading
        if (metrics.totalTime > 3000) {
          console.warn(`Slow page load detected: ${metrics.totalTime}ms`);
        }
      });
    }
  }

  static measureResourceLoading(): void {
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 1000) {
            console.warn(`Slow resource load: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }
}

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    LoadingMonitor.measurePageLoad();
    LoadingMonitor.measureResourceLoading();
    
    // Log memory usage periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        MemoryMonitor.logMemoryUsage('Periodic Check');
      }, 30000); // Every 30 seconds
    }
  }
};
