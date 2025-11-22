export interface GameState {
  timestamp: number;
  playerPosition: { x: number; y: number };
  playerRotation: number;
  playerVelocity: { x: number; y: number };
  inputState: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    shoot: boolean;
  };
  laserCount: number;
  laserPositions?: { x: number; y: number }[];
  figCount: number;
  score: number;
}

export interface InputEvent {
  timestamp: number;
  type: 'down' | 'up' | 'reset';
  code?: string;
  key?: string;
  state?: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    space: boolean;
  };
}

export class DebugLogger {
  private enabled: boolean;
  private history: GameState[] = [];
  private maxHistorySize: number;
  private logInterval: number;
  private lastLogTime: number = 0;
  private inputEvents: InputEvent[] = [];
  private maxInputEvents: number = 500;
  private maxDurationMs: number | null = null;
  private startAt: number | null = null;
  private consoleLoggingEnabled: boolean = true;

  constructor(enabled: boolean = false, maxHistorySize: number = 100, logIntervalMs: number = 100, consoleLoggingEnabled: boolean = false) {
    this.enabled = enabled;
    this.maxHistorySize = maxHistorySize;
    this.logInterval = logIntervalMs;
    this.consoleLoggingEnabled = consoleLoggingEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.resetTimer();
    if (enabled) {
      console.log('[DEBUG] Debug logging enabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  logState(state: GameState): void {
    if (!this.enabled) return;
    if (!this.withinDuration()) return;

    const now = Date.now();
    if (now - this.lastLogTime < this.logInterval) return;

    this.lastLogTime = now;
    this.history.push(state);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    if (this.consoleLoggingEnabled) {
      console.log('[DEBUG]', {
        time: state.timestamp,
        pos: `(${state.playerPosition.x.toFixed(1)}, ${state.playerPosition.y.toFixed(1)})`,
        rot: state.playerRotation.toFixed(2),
        vel: `(${state.playerVelocity.x.toFixed(3)}, ${state.playerVelocity.y.toFixed(3)})`,
        input: state.inputState,
        lasers: state.laserCount,
        figs: state.figCount,
        score: state.score
      });
    }
  }

  getHistory(): GameState[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
    this.inputEvents = [];
    console.log('[DEBUG] History cleared');
  }

  logInputEvent(event: InputEvent): void {
    if (!this.enabled) return;
    if (!this.withinDuration()) return;
    this.inputEvents.push(event);
    if (this.inputEvents.length > this.maxInputEvents) {
      this.inputEvents.shift();
    }
  }

  getInputEvents(): InputEvent[] {
    return [...this.inputEvents];
  }

  clearInputEvents(): void {
    this.inputEvents = [];
    console.log('[DEBUG] Input events cleared');
  }

  downloadInputEvents(): void {
    const data = JSON.stringify(this.inputEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figs-in-space-input-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[DEBUG] Input events downloaded');
  }

  downloadHistory(): void {
    const data = JSON.stringify(this.history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figs-in-space-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[DEBUG] History downloaded');
  }

  setMaxDurationMs(durationMs: number | null): void {
    this.maxDurationMs = durationMs;
    this.resetTimer();
    if (durationMs) {
      console.log(`[DEBUG] Logging will auto-stop after ${durationMs}ms`);
    }
  }

  private resetTimer(): void {
    this.startAt = this.enabled ? Date.now() : null;
  }

  private withinDuration(): boolean {
    if (!this.enabled) return false;
    if (this.maxDurationMs == null || this.startAt == null) return true;
    return Date.now() - this.startAt <= this.maxDurationMs;
  }

  setConsoleLogging(enabled: boolean): void {
    this.consoleLoggingEnabled = enabled;
  }
}

// Global debug instance
export const gameDebug = new DebugLogger(false, 100, 100, false);

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).gameDebug = gameDebug;
}
