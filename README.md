# Retro Vector Asteroids

Retro Vector Asteroids is a single-page HTML game inspired by the 1979 classic. It is built with PhaserJS and renders every ship, asteroid, and UI element as glowing vector strokes on a starless black canvas. The target is a lightweight arcade experience you can host on any static site.

## Features
- Phaser 3 renderer configured for crisp line primitives instead of bitmap sprites.
- Deterministic asteroid spawning and wraparound physics tuned for mouse/keyboard play.
- Minimal HUD overlays that mimic the original vector displays.
- Vite-powered local playground with hot reloading for rapid tuning.

## Project Layout
- `src/game.ts` bootstraps Phaser, registers scenes, and exposes the single-page canvas.
- `src/scenes/` contains scene classes such as `BootScene`, `GameplayScene`, and `HudScene`.
- `src/prefabs/` holds reusable vector components (ship outlines, laser bolts, asteroid shards).
- `src/theme/vectorPalette.ts` centralizes stroke widths and neon color choices.
- `src/ui/` contains HUD overlays and debug panels.
- `assets/` stores sparse audio cues or fonts alongside `assets/manifest.json`.
- `tests/` mirrors the source tree for Vitest specs and Phaser mocks.

## Getting Started
1. Install dependencies: `npm install`.
2. Start the dev server: `npm run dev` (opens http://localhost:5173 with hot reload and scene query params such as `?scene=DebugScene`).
3. Run tests: `npm run test` for Vitest, `npm run test -- run=integration` for smoke flows.
4. Build for release: `npm run build` to emit the static bundle in `dist/` ready for itch.io or GitHub Pages.

## Contributing
Follow the guidelines in `AGENTS.md`. Keep changes focused, run lint/tests (`npm run lint -- --fix` and `npm run test`), and prefer video captures or GIFs when opening a pull request that touches visual behavior.
