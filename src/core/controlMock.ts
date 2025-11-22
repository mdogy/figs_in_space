export interface MockInputSequence {
  time: number;
  keys: {
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
    space?: boolean;
  };
}

export class ControlMock {
  private enabled: boolean = false;
  private sequence: MockInputSequence[] = [];
  private startTime: number = 0;
  private currentTime: number = 0;
  private input: MockInputSequence['keys'] | null = null;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.startTime = 0; // Will be initialized on first update
      this.currentTime = 0;
      console.log('[MOCK] Control mock enabled');
    } else {
      this.input = null; // Clear direct input when disabled
      console.log('[MOCK] Control mock disabled');
    }
  }

  update(currentTime: number): void {
    if (!this.enabled) return;

    if (this.startTime === 0) {
      this.startTime = currentTime;
    }
    this.currentTime = currentTime;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setInput(input: MockInputSequence['keys']): void {
    if (this.enabled) {
        this.input = input;
    }
  }

  setSequence(sequence: MockInputSequence[]): void {
    this.input = null; // Clear direct input when a sequence is set
    this.sequence = sequence.sort((a, b) => a.time - b.time);
    console.log('[MOCK] Loaded sequence with', sequence.length, 'steps');
  }

  getCurrentInput(): MockInputSequence['keys'] | null {
    if (!this.enabled) {
      return null;
    }
    
    // Direct input from AI overrides sequence
    if (this.input) {
        return this.input;
    }
    
    if (this.sequence.length === 0) {
        return null;
    }

    const now = this.currentTime || Date.now();
    const startedAt = this.startTime || now;
    const elapsed = now - startedAt;

    // Find the most recent input state from sequence
    let currentInput = this.sequence[0].keys;
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.sequence[i].time <= elapsed) {
        currentInput = this.sequence[i].keys;
      } else {
        break;
      }
    }

    return currentInput;
  }

  reset(): void {
    this.startTime = this.currentTime || Date.now();
    console.log('[MOCK] Reset to start');
  }

  // Predefined test sequences
  static getTestSequence(name: string): MockInputSequence[] {
    const sequences: Record<string, MockInputSequence[]> = {
      'rotate-test': [
        { time: 0, keys: {} },
        { time: 500, keys: { left: true } },
        { time: 1000, keys: {} },
        { time: 1500, keys: { right: true } },
        { time: 2000, keys: {} },
        { time: 2500, keys: { left: true } },
        { time: 2750, keys: { left: true, right: true } }, // Both pressed
        { time: 3000, keys: {} }
      ],
      'thrust-test': [
        { time: 0, keys: {} },
        { time: 500, keys: { up: true } },
        { time: 2000, keys: {} },
        { time: 2500, keys: { up: true } },
        { time: 3000, keys: { up: true, down: true } }, // Both pressed
        { time: 3500, keys: {} }
      ],
      'shoot-test': [
        { time: 0, keys: {} },
        { time: 500, keys: { space: true } },
        { time: 600, keys: { space: true } }, // Still held
        { time: 900, keys: { space: true } }, // Still held
        { time: 1200, keys: {} },
        { time: 1500, keys: { space: true } },
        { time: 1700, keys: {} }
      ],
      'combined-test': [
        { time: 0, keys: {} },
        { time: 500, keys: { left: true } },
        { time: 1000, keys: { left: true, up: true } },
        { time: 1500, keys: { up: true } },
        { time: 2000, keys: { up: true, space: true } },
        { time: 2500, keys: { right: true, space: true } },
        { time: 3000, keys: {} }
      ],
      // User-requested test sequences
      'user-thrust-test': [
        { time: 0, keys: { up: true } },
        { time: 5000, keys: { up: false, down: true } },
        { time: 10000, keys: { up: true, down: false } },
        { time: 15000, keys: {} }
      ],
      'user-rotate-test': [
        { time: 0, keys: { left: true } },
        { time: 5000, keys: { left: false, right: true } },
        { time: 10000, keys: { left: true, right: false } },
        { time: 15000, keys: {} }
      ],
      'user-shoot-test': (() => {
        const seq = [];
        for (let i = 0; i < 50; i++) {
          seq.push({ time: i * 100, keys: { space: true } });
          seq.push({ time: i * 100 + 50, keys: {} });
        }
        return seq;
      })()
    };

    return sequences[name] || [];
  }
}

export const controlMock = new ControlMock();

if (typeof window !== 'undefined') {
  (window as any).controlMock = controlMock;
  (window as any).ControlMock = ControlMock;
}
