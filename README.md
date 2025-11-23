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
- `tests/`: Unit (Jest) and E2E (Playwright) tests.

## Controls
- **Arrow Keys:** Move and Rotate
- **Space:** Fire
- **Q:** Quit Game (with confirmation)
- **Unbound Key:** Triggers Help Screen (2s pause)

## Deployment to GitHub Pages

This project is configured for deployment to GitHub Pages.

### 1. Configuration

The `vite.config.ts` file has been updated with `base: '/figs_in_space/'` to ensure assets are loaded correctly. If your repository has a different name, update this value.

### 2. Build the Project

Run the following command to build the production-ready assets:
```bash
npm run build
```
This will create a `dist` directory with the compiled game.

### 3. Deploy

The easiest way to deploy is using the `gh-pages` package.

**A. Install `gh-pages`**
If you don't have it installed, add it to your dev dependencies:
```bash
npm install gh-pages --save-dev
```

**B. Add a Deploy Script**
Add the following script to your `package.json`:
```json
"scripts": {
  // ... other scripts
  "deploy": "gh-pages -d dist"
}
```

**C. Run the Deploy Script**
```bash
npm run deploy
```
This command will push the contents of the `dist` folder to a special `gh-pages` branch on your GitHub repository.

### 4. Configure GitHub Repository

1. Go to your repository on GitHub.
2. Click on the **Settings** tab.
3. In the left sidebar, click on **Pages**.
4. Under **Build and deployment**, set the **Source** to **Deploy from a branch**.
5. Set the **Branch** to `gh-pages` and the folder to `/ (root)`.
6. Click **Save**.

Your game should be live at `https://<your-username>.github.io/figs_in_space/` within a few minutes.
