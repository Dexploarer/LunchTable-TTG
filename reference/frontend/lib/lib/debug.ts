"use client";

/**
 * Centralized Debug and Logging Utilities for Frontend
 *
 * Usage:
 * - Use logger.info() for important user events
 * - Use logger.debug() for detailed debugging (only in dev)
 * - Use logger.error() for errors with context
 * - Use performance.mark/measure() for React performance
 * - Use componentLogger() for component-level debugging
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  path?: string;
  [key: string]: unknown;
}

// ============================================================================
// Environment Configuration
// ============================================================================

const IS_BROWSER = typeof window !== "undefined";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const LOG_LEVEL: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || (IS_DEVELOPMENT ? "debug" : "warn");

// Enable verbose logging via localStorage
const VERBOSE_LOGGING =
  IS_BROWSER && typeof localStorage !== "undefined" && localStorage.getItem("debug") === "true";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Core Logger
// ============================================================================

class FrontendLogger {
  private minLevel: number;

  constructor(minLevel: LogLevel = LOG_LEVEL) {
    this.minLevel = LOG_LEVELS[minLevel];
  }

  private shouldLog(level: LogLevel): boolean {
    if (VERBOSE_LOGGING) return true;
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): [string, LogContext | Record<string, never>] {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[level];

    return [`${emoji} [${timestamp}] ${message}`, context ?? {}];
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      console.log(...this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", message, context));
      if (error) {
        console.error("Error details:", error);
      }
    }
  }

  /**
   * Log user action
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, context);
  }

  /**
   * Log navigation
   */
  navigation(from: string, to: string): void {
    this.debug(`Navigation: ${from} → ${to}`);
  }

  /**
   * Log API call
   */
  apiCall(endpoint: string, method: string, context?: LogContext): void {
    this.debug(`API: ${method} ${endpoint}`, context);
  }

  /**
   * Log render
   */
  render(component: string, props?: Record<string, unknown>): void {
    this.debug(`Render: ${component}`, { component, props });
  }
}

// ============================================================================
// Component Logger
// ============================================================================

/**
 * Create a logger scoped to a specific component
 */
export function componentLogger(componentName: string) {
  return {
    debug: (message: string, context?: Omit<LogContext, "component">) =>
      logger.debug(message, { ...context, component: componentName }),

    info: (message: string, context?: Omit<LogContext, "component">) =>
      logger.info(message, { ...context, component: componentName }),

    warn: (message: string, context?: Omit<LogContext, "component">) =>
      logger.warn(message, { ...context, component: componentName }),

    error: (message: string, error?: Error, context?: Omit<LogContext, "component">) =>
      logger.error(message, error, { ...context, component: componentName }),

    render: (props?: Record<string, unknown>) => logger.render(componentName, props),
  };
}

// ============================================================================
// Performance Monitoring
// ============================================================================

class PerformanceMonitor {
  /**
   * Mark a performance point
   */
  mark(name: string): void {
    if (IS_BROWSER && performance.mark) {
      performance.mark(name);
      logger.debug(`Performance mark: ${name}`);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (!IS_BROWSER || !performance.measure) return null;

    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, "measure");
      const duration = entries[entries.length - 1]?.duration || 0;

      logger.info(`Performance: ${name} took ${duration.toFixed(2)}ms`);

      if (duration > 1000) {
        logger.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }

      return duration;
    } catch (error) {
      logger.warn("Performance measurement failed", { name, error });
      return null;
    }
  }

  /**
   * Time an operation
   */
  async time<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      logger.info(`⏱️  ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`⏱️  ${name} failed after ${duration}ms`, error as Error);
      throw error;
    }
  }
}

// ============================================================================
// React Hooks for Debugging
// ============================================================================

/**
 * Hook to log component lifecycle
 * Usage: useDebugLifecycle("MyComponent", props)
 */
export function useDebugLifecycle(componentName: string, props?: Record<string, unknown>): void {
  if (!IS_DEVELOPMENT) return;

  // Only import React hooks in browser/React context
  if (IS_BROWSER) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useEffect, useRef } = require("react");

    const renderCount = useRef(0);
    renderCount.current += 1;

    useEffect(() => {
      logger.debug(`${componentName} mounted`, { props, renderCount: renderCount.current });

      return () => {
        logger.debug(`${componentName} unmounted`);
      };
    }, []);

    useEffect(() => {
      if (renderCount.current > 1) {
        logger.debug(`${componentName} re-rendered`, { props, renderCount: renderCount.current });
      }
    });
  }
}

/**
 * Hook to track why component re-rendered
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, unknown>): void {
  if (!IS_DEVELOPMENT) return;

  if (IS_BROWSER) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useEffect, useRef } = require("react");

    const previousProps = useRef() as { current?: Record<string, unknown> };

    useEffect(() => {
      if (previousProps.current) {
        const allKeys = Object.keys({ ...previousProps.current, ...props });
        const changedProps: Record<string, { from: unknown; to: unknown }> = {};

        allKeys.forEach((key) => {
          if (previousProps.current?.[key] !== props[key]) {
            changedProps[key] = {
              from: previousProps.current?.[key],
              to: props[key],
            };
          }
        });

        if (Object.keys(changedProps).length > 0) {
          logger.debug(`${componentName} props changed:`, { changedProps });
        }
      }

      previousProps.current = props;
    });
  }
}

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Track and log errors
 */
export function trackError(error: Error, context?: LogContext): void {
  logger.error("Tracked error", error, context);

  // In production, you would send to error tracking service (Sentry, etc.)
  if (!IS_DEVELOPMENT && IS_BROWSER) {
    // Example: Sentry.captureException(error, { extra: context });
  }
}

/**
 * Global error handler setup
 */
export function setupErrorHandlers(): void {
  if (!IS_BROWSER) return;

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", undefined, {
      reason: event.reason,
      promise: event.promise,
    });
    event.preventDefault();
  });

  // Catch global errors
  window.addEventListener("error", (event) => {
    logger.error("Global error", undefined, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Enable verbose debug logging via console
 * Usage: In browser console, run: enableDebugMode()
 */
export function enableDebugMode(): void {
  if (IS_BROWSER && typeof localStorage !== "undefined") {
    localStorage.setItem("debug", "true");
    console.log("✅ Debug mode enabled. Reload page to see all logs.");
  }
}

/**
 * Disable verbose debug logging
 */
export function disableDebugMode(): void {
  if (IS_BROWSER && typeof localStorage !== "undefined") {
    localStorage.removeItem("debug");
    console.log("✅ Debug mode disabled. Reload page.");
  }
}

// ============================================================================
// Exports
// ============================================================================

export const logger = new FrontendLogger();
export const perf = new PerformanceMonitor();

// Make debug functions available globally in development
if (IS_BROWSER && IS_DEVELOPMENT) {
  window.enableDebugMode = enableDebugMode;
  window.disableDebugMode = disableDebugMode;
  window.logger = logger;
}

// Setup error handlers on import
if (IS_BROWSER) {
  setupErrorHandlers();
}
