# Software Engineering Guidelines

## 1. Project Structure & Architecture

### 1.1. Modularity & Refactoring
- **Modular Design:** The project must remain modular. Decompose complex logic into smaller, reusable utility functions and sub-modules.
- **Refactoring:** Periodically review and refactor code to reduce redundancy (DRY principle). Extract common patterns into shared utilities or base classes.
- **Functional Style:** Prefer functional programming concepts (immutability, pure functions) where performance allows.
- **Type Hinting:** Use TypeScript features extensively. Explicitly type function parameters, return values, and complex objects. Avoid `any`.

### 1.2. Layout
- `src/core/`: Engine components (config, main loop, utilities).
- `src/scenes/`: Phaser Scenes (Boot, Title, Gameplay, HUD, GameOver).
- `src/prefabs/`: Game entities (Player, Enemy, Fig).
- `src/ui/`: HUD and Interface elements.
- `src/theme/`: Visual styles and palettes.
- `tests/`: Mirror structure of `src/`.

### 1.3. Separation of Concerns
- **Rendering:** Handled by Phaser Graphics/Sprites.
- **Logic:** Decoupled from rendering where possible.
- **Input:** Mapped in Scenes, processed by Entities or Input Managers.

## 2. Testing Guidelines

### 2.1. Tools & Frameworks
- **Unit Testing:** **Jest**. Use for pure logic, math vectors, and isolated component logic.
- **E2E/Integration:** **Playwright**. Use for full game loops, scene transitions, and visual effect verification.

### 2.2. Coverage Requirements
- **Unit Tests:** Maintain **80% or higher** code coverage.
- **Acceptance Tests:** Every requirement listed in `GAME_REQUIREMENTS.md` must be anchored by an automated acceptance test that demonstrates the feature is correctly implemented.
- **Effect-First Repro:** For every reported bug, add a failing, effect-level test that reproduces the user-visible symptom *before* investigating or applying a fix. If the effect cannot be reproduced with current seams/mocks, first refactor to enable headless detection of the effect, then add the test.
- **No Fix Without Failing Test:** Do not attempt a fix until the effect-based test is red. A bug is only considered fixed when the effect-focused test turns green (not just when the suspected cause is patched).

### 2.2. Bug Fixing Workflow (TDD for Bugs)
- When a bug is identified:
    1.  **Reproduce (Effect-Level):** Write a failing test that captures the observed effect (what the user sees), not the suspected cause. If impossible, refactor to make it observable.
    2.  **Fix:** Implement the fix until the effect-focused test passes (Green).
    3.  **Refactor:** Clean up the code while ensuring tests still pass.
- Do not fix a bug without first creating a reproduction test.

## 3. Documentation
- **Currency:** Documentation must be kept up-to-date with code changes.
- **Traceability:** Ensure requirements in documentation map to specific tests or code modules.

## 4. Coding Standards

### 4.1. Types & Contracts
- Use TypeScript interfaces for state and config objects.
- Centralize magic numbers (speeds, cooldowns) in constants or config files.

### 4.2. Formatting & Linting
- **Formatter:** Prettier.
- **Linter:** ESLint with TypeScript support.
- **Command:** `npm run lint`

### 4.3. Git Discipline
- **Commits:** Atomic, descriptive (e.g., `feat: add black hole physics`).
- **Branches:** Feature branches (e.g., `feature/high-score`).

## 5. Architecture Patterns
- **Event Bus:** Use Phaser Events for loose coupling (e.g., `events.emit('PLAYER_HIT')`).
- **State Machines:** Use for Scene flow (Title -> Game -> Over) and Entity behavior (Idle -> Attack).
- **Data-Driven:** Define waves and level stats in JSON/Config objects.

## 6. Performance & Resource Management
- **Pooling:** Reuse bullets and particles; avoid `new` in `update()` loops.
- **Cleanup:** Destroy objects and remove listeners on Scene shutdown.
- **Debug:** Use `gameDebug` (see `DEBUG.md`) for performance monitoring.
