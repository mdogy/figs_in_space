# Control Logic Fixes (Archive)

This document records historical fixes to the game's control logic and collision systems.

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

### 4. Demo Mode Freeze
- **Issue:** Demo mode would freeze or go blank instead of switching states.
- **Fix:** Removed self-termination logic in `GameplayScene`. Attract cycle is now fully controlled by `TitleScene`.

### 5. Laser-Fig Collisions (Passing Through)
- **Issue:** Fast-moving lasers could pass through Figs without triggering a hit.
- **Fix:** Implemented a robust distance check with a generous buffer (`radius + 16px`) to treat lasers as "thick" projectiles, ensuring reliability.

### 6. Lives Not Decrementing / Immediate Game Over
- **Issue:** Player death sometimes didn't update the HUD or ended the game prematurely.
- **Fix:** Added explicit HUD reconnection logic and robust life-tracking logs in `GameplayScene`.
