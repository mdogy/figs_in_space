# Figs in Space

A retro vector-shooter built with PhaserJS.

## Documentation Index

- **[Game Requirements](./GAME_REQUIREMENTS.md):** Detailed breakdown of gameplay mechanics, controls, and progression.
- **[Engineering Guidelines](./SWE_GUIDELINES.md):** Coding standards, project structure, and architectural patterns.
- **[Agent Guidelines](./AGENTS.md):** Specific rules for AI agents working on this codebase.
- **[Debug Tools](./DEBUG.md):** How to use the built-in debug logger and control mock.
- **[Control Fixes](./CONTROL_FIXES.md):** History of specific control-related bug fixes.

## Quick Start

### Development
```bash
npm install
npm run dev
```
Starts the Vite server at `http://localhost:5173`.

### Linting & Testing
```bash
npm run lint        # Run ESLint
npm run test:unit   # Run Jest (Unit Tests)
npm run test:e2e    # Run Playwright (End-to-End)
```

### Production Build
```bash
npm run build
npm run preview
```
Builds to `dist/` directory.

## Project Structure
- `src/`: Source code.
- `public/`: Static assets.
- `dist/`: Build output.
- `tests/`: Unit and Integration tests.