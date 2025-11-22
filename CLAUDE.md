# AI Agent Guidelines

## 1. Core Mandates
- **Conventions:** Follow existing ESLint and Prettier configs. Match the project's architectural style.
- **Safety:** Verify code changes with tests (`npm test`). Do not break the build (`npm run build`).
- **Context:** Read `GAME_REQUIREMENTS.md` and `SWE_GUIDELINES.md` before starting complex tasks.

## 2. Codebase Specifics
- **Phaser:** Use `phaser` for the game engine.
- **Rendering:** Use `Phaser.GameObjects.Graphics` for vector visuals. Avoid importing raster images unless necessary.
- **Math:** Use `src/core/vectorMath.ts` for vector operations.
- **State:** Game state (lives, score) is managed in `GameplayScene.ts`.

## 3. Testing
- **Runner:** Vitest.
- **Mocks:** Use `tests/mocks/` for Canvas/Phaser mocking.
- **Coverage:** Aim for high coverage in `src/core/`.

## 4. Common Tasks
- **Refactoring:** Run `codebase_investigator` first to understand dependencies.
- **New Features:** Add corresponding unit tests in `tests/`.
- **Bug Fixes:** Create a reproduction test case before fixing.
