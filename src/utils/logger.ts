// src/utils/logger.ts
// Structured logger for Cloudflare Workers

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface LogContext {
  requestId?: string;
  traceId?: string;
  userId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export class Logger {
  private readonly minLevel: number;
  private readonly context: LogContext;

  constructor(level: LogLevel = 'info', context: LogContext = {}) {
    this.minLevel = LEVELS[level];
    this.context = context;
  }

  child(extra: LogContext): Logger {
    return new Logger(
      (Object.keys(LEVELS).find((k) => LEVELS[k as LogLevel] === this.minLevel) ?? 'info') as LogLevel,
      { ...this.context, ...extra }
    );
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (LEVELS[level] < this.minLevel) return;
    const entry = {
      level,
      time: new Date().toISOString(),
      message,
      ...this.context,
      ...(data !== undefined ? { data } : {}),
    };
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(entry));
  }

  debug(message: string, data?: unknown): void { this.log('debug', message, data); }
  info(message: string, data?: unknown): void { this.log('info', message, data); }
  warn(message: string, data?: unknown): void { this.log('warn', message, data); }
  error(message: string, data?: unknown): void { this.log('error', message, data); }
}

export const createLogger = (level: LogLevel = 'info', context: LogContext = {}): Logger =>
  new Logger(level, context);
