# Project Status & Todo

## Current Task: Debug Tools & Control Refinement
- [x] Implement `DebugLogger` for game state tracking
- [x] Implement `ControlMock` for automated input testing
- [x] Integrate debug tools into `GameplayScene`
- [x] Document usage in `DEBUG.md`

## Recent Fixes (Control Logic)
- [x] Fix rotation locking (independent boolean checks)
- [x] Fix laser spawn position (ship nose offset)
- [x] Fix continuous shooting input handling

## Next Steps
- [x] Validate all test sequences in `ControlMock`
- [x] Stabilize automated test harness (jsdom env, Phaser spector stub)
- [ ] Refine game difficulty curves
- [ ] Consolidate Phaser scene test helpers to reduce per-test mocking
- [x] Add tests for black hole accumulation cadence (Level 9 + every 4 levels)
- [x] Add tests for laser lifespan/range scaling every 3 levels
- [x] Add tests confirming leaderboard name entry accepts 20 characters and saves fallback names
- [x] Add acceptance test covering fig speed/count plateau after Level 9
