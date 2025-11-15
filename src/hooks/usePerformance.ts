import { useEffect, useRef, useCallback, useState } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    peakRenderTime: 0,
  });

  const startRender = useCallback(() => {
    performanceRef.current.lastRenderTime = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - performanceRef.current.lastRenderTime;
    performanceRef.current.renderCount++;
    
    // Calculate rolling average
    const count = performanceRef.current.renderCount;
    const currentAvg = performanceRef.current.averageRenderTime;
    performanceRef.current.averageRenderTime = (currentAvg * (count - 1) + renderTime) / count;
    
    // Track peak render time
    if (renderTime > performanceRef.current.peakRenderTime) {
      performanceRef.current.peakRenderTime = renderTime;
    }

    // Log performance warnings
    if (renderTime > 50) {
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
  }, []);

  const getPerformanceStats = useCallback(() => ({
    renderCount: performanceRef.current.renderCount,
    averageRenderTime: performanceRef.current.averageRenderTime,
    peakRenderTime: performanceRef.current.peakRenderTime,
  }), []);

  return { startRender, endRender, getPerformanceStats };
};

// Debounce hook for expensive operations
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for high-frequency events
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const lastCallTimer = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callbackRef.current(...args);
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callbackRef.current(...args);
        }, delay - (now - lastCall.current));
      }
    },
    [delay]
  ) as T;

  return throttledCallback;
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const memoryRef = useRef({
    peakUsage: 0,
    samples: [] as number[],
  });

  const checkMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      memoryRef.current.samples.push(usedMB);
      if (memoryRef.current.samples.length > 100) {
        memoryRef.current.samples.shift();
      }
      
      if (usedMB > memoryRef.current.peakUsage) {
        memoryRef.current.peakUsage = usedMB;
      }

      // Warn if memory usage is high
      if (usedMB > 100) {
        console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB`);
      }
      
      return {
        current: usedMB,
        peak: memoryRef.current.peakUsage,
        average: memoryRef.current.samples.reduce((a, b) => a + b, 0) / memoryRef.current.samples.length,
      };
    }
    return null;
  }, []);

  return { checkMemory };
};

// Canvas optimization hook
export const useCanvasOptimization = () => {
  const optimizationRef = useRef({
    lastOptimization: 0,
    isDirty: false,
    offscreenCanvas: null as OffscreenCanvas | null,
  });

  const shouldOptimize = useCallback(() => {
    const now = Date.now();
    return now - optimizationRef.current.lastOptimization > 1000; // Optimize every second
  }, []);

  const markDirty = useCallback(() => {
    optimizationRef.current.isDirty = true;
  }, []);

  const optimizeCanvas = useCallback((canvas: HTMLCanvasElement) => {
    if (!optimizationRef.current.isDirty || !shouldOptimize()) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Set optimal composite operation for performance
    ctx.globalCompositeOperation = 'source-over';

    optimizationRef.current.isDirty = false;
    optimizationRef.current.lastOptimization = Date.now();
  }, [shouldOptimize]);

  return { optimizeCanvas, markDirty, shouldOptimize };
};

const performanceHooks = {
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useMemoryMonitor,
  useCanvasOptimization,
};

export default performanceHooks;