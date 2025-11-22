# Control Fixes

## Issues Fixed

### 1. Rotation Controls Getting Stuck

**Problem:** After pressing left, then right, then left again, rotation would stop working.

**Root Cause:** The code used `else if` for rotation handling:
```typescript
// BEFORE (broken)
if (leftPressed) {
  rotate(-speed);
} else if (rightPressed) {  // ← Skipped if left was true!
  rotate(+speed);
}
```

This meant only ONE direction could be processed per frame. If both keys were transitioning, the second key would be ignored.

**Fix:** Changed to independent key checks with additive rotation:
```typescript
// AFTER (fixed)
let rotationDelta = 0;
if (leftPressed) {
  rotationDelta -= speed;
}
if (rightPressed) {
  rotationDelta += speed;
}
this.player.rotation += rotationDelta;
```

Now both keys are checked every frame, and they can cancel each other out if both are pressed.

### 2. Continuous Shooting

**Problem:** Once shooting started, it wouldn't stop even after releasing the space bar.

**Root Cause:** The code only checked if the key was down and respected cooldown, but didn't require a key release between shots:
```typescript
// BEFORE (broken)
if (shootPressed && time - lastShot > cooldown) {
  shoot();
  lastShot = time;
}
```

This meant holding the key would fire every 200ms indefinitely.

**Fix:** Added `isShooting` state flag that requires key release:
```typescript
// AFTER (fixed)
if (!shootPressed) {
  this.isShooting = false;
  return;
}
if (this.isShooting) {
  return;  // Already shot, waiting for key release
}
// ... cooldown check ...
this.isShooting = true;
shoot();
```

Now you must release and press again for each shot.

### 3. Lasers Spawning from Wrong Position

**Problem:** Lasers came out of the side of the ship, not the front.

**Root Cause:** The code subtracted `PI/2` from the rotation angle:
```typescript
// BEFORE (broken)
const muzzleAngle = this.player.rotation - Math.PI / 2;
```

This was based on an incorrect assumption about ship orientation. The ship is drawn pointing RIGHT (0 degrees = East) in its local coordinate system, not UP.

**Fix:** Use the rotation directly without adjustment:
```typescript
// AFTER (fixed)
const muzzleAngle = this.player.rotation;
const muzzleX = shipX + cos(muzzleAngle) * noseOffset;
const muzzleY = shipY + sin(muzzleAngle) * noseOffset;
```

Ship geometry:
- Nose at `(24, 0)` in local space → points RIGHT
- Rotation = 0 → ship points East (→)
- Rotation = π/2 → ship points South (↓)
- Rotation = π → ship points West (←)
- Rotation = 3π/2 → ship points North (↑)

The same fix was applied to thrust direction.

## Debug Tools Added

See [DEBUG.md](./DEBUG.md) for complete documentation.

### Quick Start

```javascript
// Enable debug logging in browser console
gameDebug.setEnabled(true);

// Test rotation with mock controls
controlMock.setSequence(ControlMock.getTestSequence('rotate-test'));
controlMock.setEnabled(true);

// Download game state history
gameDebug.downloadHistory();
```

## Testing

To verify the fixes:

1. **Rotation:** Press left → right → left → right repeatedly. Ship should smoothly change direction each time.

2. **Shooting:** Press and hold space. Only one shot should fire. Release and press again for another shot.

3. **Laser direction:** Rotate the ship and fire. Lasers should always emerge from the triangular nose and travel in the direction the ship is pointing.

4. **Combined:** Rotate while shooting. Both should work independently.
