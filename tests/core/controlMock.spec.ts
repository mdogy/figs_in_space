import { ControlMock, MockInputSequence } from '../../src/core/controlMock';

describe('ControlMock', () => {
  let controlMock: ControlMock;

  beforeEach(() => {
    controlMock = new ControlMock();
  });

  it('should be disabled by default', () => {
    expect(controlMock.isEnabled()).toBe(false);
    expect(controlMock.getCurrentInput()).toBeNull();
  });

  it('should return null input when enabled but no sequence or input set', () => {
    controlMock.setEnabled(true);
    expect(controlMock.getCurrentInput()).toBeNull();
  });

  it('should allow manual input setting', () => {
    controlMock.setEnabled(true);
    const input = { left: true, space: true };
    controlMock.setInput(input);
    expect(controlMock.getCurrentInput()).toEqual(input);
  });

  it('should play back a sequence correctly based on time', () => {
    const sequence: MockInputSequence[] = [
      { time: 0, keys: { up: true } },
      { time: 100, keys: { up: true, space: true } },
      { time: 200, keys: {} }
    ];

    controlMock.setSequence(sequence);
    controlMock.setEnabled(true);

    // Start time initialized on first update
    const startTime = 1000;
    controlMock.update(startTime);

    // At t=0 (relative)
    expect(controlMock.getCurrentInput()).toEqual({ up: true });

    // At t=50 (relative) - should still be first frame
    controlMock.update(startTime + 50);
    expect(controlMock.getCurrentInput()).toEqual({ up: true });

    // At t=100 (relative)
    controlMock.update(startTime + 100);
    expect(controlMock.getCurrentInput()).toEqual({ up: true, space: true });

    // At t=150 (relative)
    controlMock.update(startTime + 150);
    expect(controlMock.getCurrentInput()).toEqual({ up: true, space: true });

    // At t=200 (relative)
    controlMock.update(startTime + 200);
    expect(controlMock.getCurrentInput()).toEqual({});
  });

  it('should respect reset', () => {
    const sequence: MockInputSequence[] = [
      { time: 0, keys: { up: true } },
      { time: 100, keys: {} }
    ];

    controlMock.setSequence(sequence);
    controlMock.setEnabled(true);
    
    const startTime = 1000;
    controlMock.update(startTime);
    
    // Advance to end
    controlMock.update(startTime + 200);
    expect(controlMock.getCurrentInput()).toEqual({});

    // Reset
    controlMock.reset();
    // Need to update to set new start time (reset sets startTime to now, but update sets it if 0? No, reset sets it to current time)
    // The implementation of reset() says: this.startTime = this.currentTime || Date.now();
    
    // So if we update again with a new time, it should be relative to that reset time.
    // Let's just verify it goes back to start state effectively.
    
    // If reset uses currentTime, we need to ensure currentTime is what we expect.
    // logic: this.currentTime is set in update().
    
    controlMock.update(startTime + 300); // time advanced
    controlMock.reset(); // startTime = startTime + 300
    
    // Now if we query, elapsed = (startTime + 300) - (startTime + 300) = 0
    expect(controlMock.getCurrentInput()).toEqual({ up: true });
  });

  it('should return empty keys if time is past last sequence item? No, it stays on last item', () => {
    // Implementation check:
    // for loop goes through sequence. if time <= elapsed, currentInput = item.keys.
    // If elapsed is past all times, it keeps the last one that matched.
    
    const sequence: MockInputSequence[] = [
      { time: 0, keys: { up: true } },
      { time: 100, keys: {} }
    ];
    controlMock.setSequence(sequence);
    controlMock.setEnabled(true);
    controlMock.update(0);
    
    controlMock.update(500); // Past 100
    expect(controlMock.getCurrentInput()).toEqual({});
  });

  it('should retrieve test sequences', () => {
    const seq = ControlMock.getTestSequence('rotate-test');
    expect(seq).toBeDefined();
    expect(seq.length).toBeGreaterThan(0);
  });
});
