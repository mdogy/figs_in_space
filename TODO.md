# Project Status & Todo

## Current Task: Final Polish & Verification
- [x] **Feature: Quit Game**
    - [x] Bind 'q' key to quit.
    - [x] Show "Are you sure?" confirmation dialog.
- [x] **Feature: Help Screen**
    - [x] Show key bindings and explanation at game start.
    - [x] Freeze game and show help screen for 2 seconds if unbound key is pressed.
- [x] **Feature: Alien Spawning Logic**
    - [x] Aliens appear only at the beginning of the level.
    - [x] Aliens persist until killed (no respawn).
    - [x] Multiple aliens coexist on screen.
- [x] **Bug Fix: High Score Text**
    - [x] Removed duplicate text creation in LeaderboardScene.

## Recent Fixes (Bugs)
- [x] Fixed Demo Mode freeze (removed self-termination in GameplayScene).
- [x] Fixed Laser-Fig collision (passing through) using robust distance check.
- [x] Fixed Lives/Game Over bug (HUD reconnection + explicit logging).

## Backlog & Tech Debt
- [ ] Refine game difficulty curves.
- [ ] Consolidate Phaser scene test helpers.
- [ ] Implement yo-yo favicon asset.
- [ ] Document known WSL/Dropbox cache constraints.

## Failing Tests

During the last commit, a pre-commit hook triggered the test suite, and several tests failed. These issues need to be investigated and resolved:

-   **Scene Lifecycle Errors:** Tests in `tests/scenes/standby_lifecycle.spec.ts` are failing with `TypeError: Cannot destructure property 'width' of 'this.scale' as it is undefined` in `GameOverScene.ts`. This indicates problems with scene initialization or mocking in the test environment.
-   **E2E Test Configuration Issues:** Tests in `tests/e2e/repro_bugs.spec.ts` and `tests/e2e/example.spec.ts` are failing with `ReferenceError: TransformStream is not defined`. This suggests that Playwright (E2E) tests are being run in an incorrect environment (e.g., by Jest), or that the test setup is missing necessary browser-like APIs.
-   **Graphics Mocking Problems:** Tests in `tests/scenes/gameplay_progression.spec.ts` and `tests/scenes/gameplay_lifecycle.spec.ts` are failing with `TypeError: bg.fillStyle is not a function` in `src/ui/HelpOverlay.ts`. This indicates that the mock for `Phaser.GameObjects.Graphics` is incomplete or incorrect, not providing expected methods like `fillStyle`.