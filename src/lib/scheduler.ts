type Task = () => Promise<void>;

interface ScheduledTask {
  id: string;
  task: Task;
  interval: number;
  lastRun: number;
}

export class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervalId: number | null = null;

  constructor(private checkInterval = 1000) {}

  schedule(id: string, task: Task, interval: number): void {
    this.tasks.set(id, {
      id,
      task,
      interval,
      lastRun: 0,
    });

    if (!this.intervalId) {
      this.start();
    }
  }

  unschedule(id: string): void {
    this.tasks.delete(id);
    if (this.tasks.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    this.intervalId = setInterval(() => this.checkTasks(), this.checkInterval);
  }

  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkTasks(): Promise<void> {
    const now = Date.now();

    for (const task of this.tasks.values()) {
      if (now - task.lastRun >= task.interval) {
        try {
          await task.task();
          task.lastRun = now;
        } catch (error) {
          console.error(`Task ${task.id} failed:`, error);
        }
      }
    }
  }
}