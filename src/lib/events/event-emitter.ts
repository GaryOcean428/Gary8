type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(_event: string, _callback: EventCallback): void {
    if (!this.events[_event]) {
      this.events[_event] = [];
    }
    this.events[_event].push(_callback);
  }

  off(_event: string, _callback: EventCallback): void {
    if (!this.events[_event]) return;
    this.events[_event] = this.events[_event].filter(_cb => _cb !== _callback);
  }

  emit(_event: string, ..._args: any[]): void {
    if (!this.events[_event]) return;
    this.events[_event].forEach(_callback => _callback(..._args));
  }

  once(_event: string, _callback: EventCallback): void {
    const wrapper = (..._args: any[]) => {
      _callback(..._args);
      this.off(_event, wrapper);
    };
    this.on(_event, wrapper);
  }

  removeAllListeners(_event?: string): void {
    if (_event) {
      delete this.events[_event];
    } else {
      this.events = {};
    }
  }
}