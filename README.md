# Figs in Space

A retro vector-shooter built with PhaserJS.

## Documentation Index

- **[Game Requirements](./GAME_REQUIREMENTS.md):** Detailed breakdown of gameplay mechanics, controls, and progression.
- **[Engineering Guidelines](./SWE_GUIDELINES.md):** Coding standards, project structure, and architectural patterns.
- **[Debug Tools](./DEBUG.md):** How to use the built-in debug logger and control mock.
- **[Control Fixes](./CONTROL_FIXES.md):** History of specific control-related bug fixes.

### AI Agent Guidelines
This project includes specific, up-to-date guidelines for different AI agents. They are kept in sync to reflect the current project status.

- **[GEMINI.md](./GEMINI.md):** For use with the Gemini CLI.
- **[AGENTS.md](./AGENTS.md):** For use with the Codex CLI (ChatGPT).
- **[CLAUDE.md](./CLAUDE.md):** For use with Claude.

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Cleans previous builds and starts the Vite server at `http://localhost:5173`.

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
Cleans previous builds and creates a production-ready build in the `dist/` directory. Use `npm run preview` to serve the `dist` folder locally.

### Cleaning
```bash
npm run clean
```
Removes build artifacts (`dist/`) and compiled JavaScript files from the `src/` and `tests/` directories.

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

This project is configured for deployment to GitHub Pages using the `gh-pages` package.

### 1. Build
Ensure your project is ready for deployment by creating a production build:
```bash
npm run build
```

### 2. Deploy
Run the deploy script:
```bash
npm run deploy
```
This command pushes the contents of the `dist/` folder to the `gh-pages` branch on your GitHub repository, which will trigger a GitHub Pages deployment.

### Troubleshooting: SSH Passphrase Prompts
If you are repeatedly asked for your SSH key passphrase during deployment, it is recommended to use an `ssh-agent` to manage your key.

1.  **Start the agent:**
    ```bash
    eval "$(ssh-agent -s)"
    ```
2.  **Add your key:** (Replace with your key file if different)
    ```bash
    ssh-add ~/.ssh/id_rsa
    ```
You will be prompted for your passphrase once, and it will be remembered for the rest of your session.

### Repository Configuration
For the deployment to work, ensure your repository's GitHub Pages settings are configured to **"Deploy from a branch"** and the source is set to the `gh-pages` branch with the `/ (root)` folder.
