type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: unknown;
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

  debug(_message: string, _details?: unknown) {
    this.log('debug', _message, _details);
  }

  info(_message: string, _details?: unknown) {
    this.log('info', _message, _details);
  }

  warn(_message: string, _details?: unknown) {
    this.log('warn', _message, _details);
  }

  error(_message: string, _details?: unknown) {
    this.log('error', _message, _details);
  }

  private log(_level: LogLevel, _message: string, _details?: unknown) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      _level,
      _message,
      _details
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for development
    console[_level](_message, _details || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();