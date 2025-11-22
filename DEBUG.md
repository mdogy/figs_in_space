# Debug Tools

## Overview

The Asteroids game includes debugging tools to help diagnose control and game state issues.

## Debug Logger

The debug logger tracks game state history and can output it to the console or download as JSON.

### Usage

Open the browser console and use these commands:

```javascript
// Enable debug logging
gameDebug.setEnabled(true);

// Disable debug logging
gameDebug.setEnabled(false);

// Download game state history as JSON
gameDebug.downloadHistory();

// Clear history
gameDebug.clear();

// View current history
gameDebug.getHistory();
```

### Logged State

Each log entry contains:
- `timestamp`: Game time in milliseconds
- `playerPosition`: {x, y} coordinates
- `playerRotation`: Rotation in radians
- `playerVelocity`: {x, y} velocity vector
- `inputState`: Current state of all input keys
- `laserCount`: Number of active laser bolts
- `asteroidCount`: Number of active asteroids
- `score`: Current score

## Control Mock

The control mock allows you to test the game with predefined input sequences.

### Usage

```javascript
// Enable the control mock
controlMock.setEnabled(true);

// Load a test sequence
controlMock.setSequence(ControlMock.getTestSequence('rotate-test'));

// Reset to beginning of sequence
controlMock.reset();

// Disable mock (return to keyboard control)
controlMock.setEnabled(false);
```

### Available Test Sequences

- `rotate-test`: Tests left/right rotation including simultaneous key presses
- `thrust-test`: Tests thrust control
- `shoot-test`: Tests shooting with cooldown
- `combined-test`: Tests combined inputs (rotation + thrust + shooting)

### Custom Sequences

Create your own test sequence:

```javascript
const customSequence = [
  { time: 0, keys: {} },                    // No keys at start
  { time: 500, keys: { left: true } },      // Press left at 500ms
  { time: 1000, keys: { up: true } },       // Release left, press up at 1000ms
  { time: 1500, keys: { up: true, space: true } }, // Add shooting at 1500ms
  { time: 2000, keys: {} }                  // Release all at 2000ms
];

controlMock.setSequence(customSequence);
controlMock.setEnabled(true);
```

## Common Debugging Workflows

### Test Control Responsiveness

```javascript
// 1. Enable debug logging
gameDebug.setEnabled(true);

// 2. Play the game normally
// (The console will show real-time state)

// 3. Download the data
gameDebug.downloadHistory();

// 4. Analyze the JSON for unexpected state changes
```

### Reproduce Control Issues

```javascript
// 1. Enable mock controls
controlMock.setEnabled(true);

// 2. Load the problematic sequence
controlMock.setSequence(ControlMock.getTestSequence('rotate-test'));

// 3. Enable debug logging
gameDebug.setEnabled(true);

// 4. Watch the console for unexpected behavior
// 5. Download history for detailed analysis
gameDebug.downloadHistory();
```

### Test Laser Firing

```javascript
controlMock.setEnabled(true);
controlMock.setSequence(ControlMock.getTestSequence('shoot-test'));
gameDebug.setEnabled(true);

// Watch laser count in console
// Should respect 200ms cooldown
```

## Troubleshooting

### Controls feel stuck

This was caused by the `else if` pattern in rotation handling. The fix ensures both left and right keys are checked independently each frame.

**Before (buggy):**
```javascript
if (left) rotate(-1)
else if (right) rotate(1)  // Skipped if left was true!
```

**After (fixed):**
```javascript
if (left && !right) rotate(-1)
else if (right && !left) rotate(1)
// Both pressed = cancel out
```

### Lasers not firing from ship nose

The laser spawn position now calculates the ship's nose position:

```javascript
const shipNoseOffset = 24; // Half of ship size
const muzzleX = shipX + cos(angle) * shipNoseOffset;
const muzzleY = shipY + sin(angle) * shipNoseOffset;
```

### Gun keeps firing

This should be resolved by the cooldown system. If it persists:

1. Check that `SHOT_COOLDOWN_MS` is set (200ms default)
2. Enable debug logging and check the `inputState.shoot` field
3. Verify the time delta between shots in the debug log
