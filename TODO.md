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
- [ ] Fix demo attract mode to keep gameplay running under blinking "INSERT COIN"
- [ ] Fix laser firing input so PlayerShip shoots on spacebar (regression)
- [ ] Fix player death flow: explosion + respawn for remaining lives; delay before GAME OVER
- [ ] Implement yo-yo favicon asset per requirements and wire into index.html
- [ ] Add tests for demo overlay allowing gameplay updates
- [ ] Add tests covering laser fire after spacebar press
- [ ] Add tests for explosion/respawn sequence and GAME OVER delay
- [ ] Add tests for fig collisions with player lasers (split/destroy)
- [ ] Document known WSL/Dropbox cache constraints for Vite dev server
- [ ] Build headless/effect-level regression harness for demo attract mode, player laser vs fig collisions, and multi-life death flow (must fail before fixes)
- [ ] Block fixes until above effect-based tests reproduce user-visible bugs
