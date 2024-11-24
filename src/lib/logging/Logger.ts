type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, details?: any) {
    this.log('debug', message, details);
  }

  info(message: string, details?: any) {
    this.log('info', message, details);
  }

  warn(message: string, details?: any) {
    this.log('warn', message, details);
  }

  error(message: string, details?: any) {
    this.log('error', message, details);
  }

  private log(level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      details
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for development
    console[level](message, details || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();