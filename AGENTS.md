# Repository Guidelines

## Project Structure & Module Organization
Gameplay logic sits in `src/`: `src/core/` for physics helpers, `src/scenes/` for Phaser scenes, `src/prefabs/` for reusable vector-drawn components, and `src/ui/` for HUD overlays. `src/game.ts` wires the single-page Phaser config, scene list, and shared singletons. Visuals rely on Phaser graphics strokes using palettes in `src/theme/vectorPalette.ts`. Minimal audio and fonts live in `assets/` with `assets/manifest.json`. Tests mirror their code under `tests/core` and `tests/scenes`.

## Build, Test, and Development Commands
Run `npm install` once. `npm run dev` starts Vite + Phaser at http://localhost:5173, hot-reloads the single-page shell, and honors scene query params like `?scene=DebugScene`. `npm run build` emits a minified bundle into `dist/` for static hosting. Guard changes with `npm run lint` (ESLint + Prettier) and `npm run test` (Vitest).

## Coding Style & Naming Conventions
TypeScript uses 2-space indentation and trailing commas. Scenes extend `Phaser.Scene` and follow PascalCase (e.g., `GameplayScene`, `HudScene`); helpers and factories stay camelCase. Keep Phaser side effects (tweens, timers, audio) inside scene methods, favor pure functions for calculations, and draw ships/asteroids with thin strokes (`lineWidth <= 3`, monochrome palette) to preserve the retro vector look. Run `npm run lint -- --fix` before committing.

## Testing Guidelines
Vitest is the authoritative test runner. Name specs `{unit}.spec.ts` under `tests/` so snapshots never leak into bundles. Mock the Canvas context and Phaser runtime with helpers in `tests/mocks/canvas.ts` and `tests/mocks/phaser.ts`, and seed RNG-dependent tests with `withDeterministicRng`. Validate that procedural vector outlines stay within the playfield via geometry assertions. Aim for 90% line coverage on `src/core` and 80% elsewhere. Integration smoke tests run `npm run test -- run=integration` to exercise a full scene flow before each release branch.

## Commit & Pull Request Guidelines
Follow the `<scope>: <action>` prefix from existing history, e.g., `engine: resolve wraparound bug` or `ui: tune health readout`. Each commit should tackle a single concern and include updated tests or a rationale for missing coverage. Pull requests must describe the gameplay impact, link the tracked issue, attach a short screen capture for visual fixes, and note any asset dependencies. Await at least one maintainer review before merging to `main`.

## Security & Configuration Tips
Never commit `.env.local`; Canvas API keys or telemetry tokens belong there and are read via `import.meta.env`. Review `package-lock.json` during dependency bumps, and run `npm audit` monthly. Because tooling is cross-platform, keep shell scripts POSIX-compliant and prefer Node-based helpers when OS-specific behavior creeps in.
