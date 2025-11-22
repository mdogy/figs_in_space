# Control Logic Fixes (Archive)

This document records historical fixes to the game's control logic.

## Resolved Issues

### 1. Rotation Controls Getting Stuck
- **Issue:** Alternating Left/Right keys caused rotation to lock up.
- **Fix:** Switched from `if/else if` to independent boolean checks with additive rotation.

### 2. Continuous Shooting
- **Issue:** Holding Spacebar fired continuously without cooldown or release requirement.
- **Fix:** Implemented `isShooting` flag to require key release between shots.

### 3. Laser Spawn Position
- **Issue:** Lasers spawned from the side of the ship.
- **Fix:** Corrected vector math to align spawn point with the ship's nose (rotated).