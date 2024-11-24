export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface LoggerOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp?: boolean;
}

type LogSubscriber = (entry: LogEntry) => void;

class ThoughtLogger {
  private options: LoggerOptions = {
    level: 'info',
    timestamp: true
  };
  private subscribers: Set<LogSubscriber> = new Set();

  constructor(options?: Partial<LoggerOptions>) {
    this.options = { ...this.options, ...options };
  }

  subscribe(callback: LogSubscriber) {
    this.subscribers.add(callback);
    return {
      unsubscribe: () => {
        this.subscribers.delete(callback);
      }
    };
  }

  private notify(entry: LogEntry) {
    this.subscribers.forEach(subscriber => subscriber(entry));
  }

  private createLogEntry(level: LogEntry['level'], message: string): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now()
    };
  }

  log(message: string, ...args: any[]): void {
    if (this.options.level === 'error') return;
    const entry = this.createLogEntry('info', message);
    console.log(`${this.getTimestamp()}${message}`, ...args);
    this.notify(entry);
  }

  debug(message: string, ...args: any[]): void {
    if (this.options.level !== 'debug') return;
    const entry = this.createLogEntry('debug', message);
    console.debug(`${this.getTimestamp()}${message}`, ...args);
    this.notify(entry);
  }

  info(message: string, ...args: any[]): void {
    if (this.options.level === 'error' || this.options.level === 'warn') return;
    const entry = this.createLogEntry('info', message);
    console.info(`${this.getTimestamp()}${message}`, ...args);
    this.notify(entry);
  }

  warn(message: string, ...args: any[]): void {
    if (this.options.level === 'error') return;
    const entry = this.createLogEntry('warn', message);
    console.warn(`${this.getTimestamp()}${message}`, ...args);
    this.notify(entry);
  }

  error(message: string, ...args: any[]): void {
    const entry = this.createLogEntry('error', message);
    console.error(`${this.getTimestamp()}${message}`, ...args);
    this.notify(entry);
  }

  private getTimestamp(): string {
    if (!this.options.timestamp) return '';
    return `[${new Date().toISOString()}] `;
  }
}

export const thoughtLogger = new ThoughtLogger();
